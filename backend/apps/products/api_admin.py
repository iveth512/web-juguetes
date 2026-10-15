import logging

from django.db import transaction
from django.db.models import F, Q, Sum
from PIL import Image
from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from core.pagination import StandardPagination

from .models import Product, ProductImage, Category, Franchise, Brand
from .serializers import ProductImageSerializer

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGES = 10
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
SOLD_STATUSES = [Order.Status.PAID, Order.Status.SHIPPED, Order.Status.DELIVERED]

ADMIN_ORDERING = {
    "recientes": "-created_at",
    "nombre": "name",
    "precio": "base_price",
    "-precio": "-base_price",
    "stock": "stock",
    "vendidos": "-units_sold",
}


class AdminProductWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    short_description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category",
        error_messages={"does_not_exist": "La categoria no existe."},
    )
    franchise_id = serializers.PrimaryKeyRelatedField(
        queryset=Franchise.objects.all(), source="franchise",
        error_messages={"does_not_exist": "La franquicia no existe."},
    )
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand",
        error_messages={"does_not_exist": "La marca no existe."},
    )
    sku = serializers.CharField(max_length=50)
    base_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    compare_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=0, required=False, allow_null=True,
    )
    stock = serializers.IntegerField(min_value=0, default=0)
    is_active = serializers.BooleanField(default=True)
    is_featured = serializers.BooleanField(default=False)
    is_new = serializers.BooleanField(default=False)
    is_on_sale = serializers.BooleanField(default=False)
    sale_percentage = serializers.IntegerField(
        min_value=0, max_value=100, required=False, allow_null=True,
    )

    NULLABLE_NUMBERS = ("compare_price", "sale_percentage")

    def to_internal_value(self, data):
        # Multipart forms send "" for unset optional numbers and repeat keys
        # for file lists; keep only the scalar fields this serializer knows.
        if hasattr(data, "getlist"):
            data = {k: data.get(k) for k in data.keys() if k in self.fields}
        data = {
            k: (None if k in self.NULLABLE_NUMBERS and v == "" else v)
            for k, v in data.items()
        }
        return super().to_internal_value(data)

    def validate_sku(self, value):
        value = value.strip()
        clash = Product.objects.filter(sku__iexact=value)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("Ya existe un producto con este SKU.")
        return value

    def validate(self, attrs):
        base = attrs.get("base_price", getattr(self.instance, "base_price", None))
        compare = attrs.get("compare_price", getattr(self.instance, "compare_price", None))
        if compare is not None and base is not None and compare <= base:
            raise serializers.ValidationError(
                {"compare_price": "El precio de comparacion debe ser mayor que el precio base."}
            )
        on_sale = attrs.get("is_on_sale", getattr(self.instance, "is_on_sale", False))
        if not on_sale:
            attrs["sale_percentage"] = None
        return attrs


class AdminProductSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    franchise_id = serializers.UUIDField(read_only=True)
    franchise_name = serializers.CharField(source="franchise.name", read_only=True)
    brand_id = serializers.UUIDField(read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    units_sold = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "short_description", "description",
            "category_id", "category_name", "franchise_id", "franchise_name",
            "brand_id", "brand_name", "base_price", "compare_price", "stock",
            "low_stock_threshold", "has_variants", "is_active", "is_featured",
            "is_new", "is_on_sale", "sale_percentage", "images", "units_sold",
            "created_at", "updated_at",
        ]


def _admin_queryset():
    return (
        Product.objects.select_related("category", "franchise", "brand")
        .prefetch_related("images")
        .annotate(
            units_sold=Sum(
                "order_items__quantity",
                filter=Q(order_items__order__status__in=SOLD_STATUSES),
            )
        )
    )


def _validate_images(files):
    if len(files) > MAX_IMAGES:
        return f"Maximo {MAX_IMAGES} imagenes."
    for f in files:
        if f.size > MAX_IMAGE_BYTES:
            return f"{f.name}: supera 5 MB."
        if f.content_type not in ALLOWED_IMAGE_TYPES:
            return f"{f.name}: formato no permitido (usa JPG, PNG o WEBP)."
        # The declared content type is client-controlled: check the bytes.
        try:
            with Image.open(f) as img:
                fmt = img.format
                img.verify()
        except Exception:
            return f"{f.name}: no es una imagen valida."
        finally:
            f.seek(0)
        if fmt not in ALLOWED_IMAGE_FORMATS:
            return f"{f.name}: formato no permitido (usa JPG, PNG o WEBP)."
    return None


def _ensure_primary_image(product):
    images = list(product.images.order_by("display_order"))
    if images and not any(img.is_primary for img in images):
        images[0].is_primary = True
        images[0].save(update_fields=["is_primary"])


def _serialize(request, pk):
    product = _admin_queryset().get(pk=pk)
    return AdminProductSerializer(product, context={"request": request}).data


class AdminProductListCreate(APIView):
    """GET: every product (active or not) with filters. POST: create."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = _admin_queryset()
        params = request.query_params

        q = params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(sku__icontains=q))
        state = params.get("estado")
        if state == "activos":
            qs = qs.filter(is_active=True)
        elif state == "inactivos":
            qs = qs.filter(is_active=False)
        elif state == "bajo_stock":
            qs = qs.filter(is_active=True, stock__lte=F("low_stock_threshold"))
        if params.get("categoria"):
            qs = qs.filter(category_id=params["categoria"])

        qs = qs.order_by(ADMIN_ORDERING.get(params.get("orden"), "-created_at"), "name")

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        data = AdminProductSerializer(page, many=True, context={"request": request}).data
        return paginator.get_paginated_response(data)

    def post(self, request):
        serializer = AdminProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        images = request.FILES.getlist("images")
        image_error = _validate_images(images)
        if image_error:
            return Response({"detail": image_error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product = Product.objects.create(**serializer.validated_data)
                for i, image in enumerate(images):
                    ProductImage.objects.create(
                        product=product, image=image, is_primary=(i == 0), display_order=i,
                    )
        except Exception:
            logger.exception("Admin product creation failed")
            return Response(
                {"detail": "No se pudo crear el producto. Revisa los datos e imagenes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(_serialize(request, product.pk), status=status.HTTP_201_CREATED)


class AdminProductDetail(APIView):
    """GET / PATCH / DELETE one product.

    PATCH accepts any subset of fields, plus (multipart) new `images`,
    `remove_image_ids` and `primary_image_id`.
    """

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get(self, pk):
        return Product.objects.filter(pk=pk).first()

    def get(self, request, pk):
        if self._get(pk) is None:
            return Response({"detail": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize(request, pk))

    def patch(self, request, pk):
        product = self._get(pk)
        if product is None:
            return Response({"detail": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminProductWriteSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_images = request.FILES.getlist("images")
        remove_ids = (
            request.data.getlist("remove_image_ids")
            if hasattr(request.data, "getlist") else request.data.get("remove_image_ids", [])
        )
        primary_id = request.data.get("primary_image_id")

        kept = product.images.exclude(pk__in=remove_ids).count()
        if kept + len(new_images) > MAX_IMAGES:
            return Response({"detail": f"Maximo {MAX_IMAGES} imagenes."}, status=status.HTTP_400_BAD_REQUEST)
        image_error = _validate_images(new_images)
        if image_error:
            return Response({"detail": image_error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for field, value in serializer.validated_data.items():
                    setattr(product, field, value)
                product.save()

                if remove_ids:
                    product.images.filter(pk__in=remove_ids).delete()
                next_order = (product.images.order_by("-display_order").values_list("display_order", flat=True).first() or 0) + 1
                for i, image in enumerate(new_images):
                    ProductImage.objects.create(product=product, image=image, display_order=next_order + i)
                if primary_id and product.images.filter(pk=primary_id).exists():
                    product.images.update(is_primary=False)
                    product.images.filter(pk=primary_id).update(is_primary=True)
                _ensure_primary_image(product)
        except Exception:
            logger.exception("Admin product update failed")
            return Response(
                {"detail": "No se pudo actualizar el producto. Revisa los datos e imagenes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(_serialize(request, pk))

    def delete(self, request, pk):
        product = self._get(pk)
        if product is None:
            return Response({'detail': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if product.order_items.exists():
            # Products with sales history are hidden, never deleted.
            product.is_active = False
            product.save(update_fields=["is_active", "updated_at"])
            return Response(
                {"detail": "El producto tiene pedidos; se desactivo en lugar de eliminarse.", "deactivated": True},
                status=status.HTTP_200_OK,
            )
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoriesListView(APIView):
    """Return all categories/franchises/brands for admin dropdowns"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        categories = list(Category.objects.filter(is_active=True).values('id', 'name'))
        franchises = list(Franchise.objects.filter(is_active=True).values('id', 'name'))
        brands = list(Brand.objects.filter(is_active=True).values('id', 'name'))
        return Response({
            'categories': categories,
            'franchises': franchises,
            'brands': brands,
        })
