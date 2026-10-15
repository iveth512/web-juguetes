from rest_framework import serializers

from apps.products.models import (
    Brand,
    Category,
    Franchise,
    Product,
    ProductImage,
    ProductVariant,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "parent",
            "display_order",
            "product_count",
        ]


class FranchiseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Franchise
        fields = ["id", "name", "slug", "logo"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "display_order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "name",
            "sku",
            "price",
            "compare_price",
            "stock",
            "is_active",
            "display_order",
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="name", read_only=True)
    franchise = serializers.SlugRelatedField(slug_field="name", read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "category",
            "franchise",
            "sku",
            "base_price",
            "compare_price",
            "has_variants",
            "stock",
            "low_stock_threshold",
            "is_new",
            "is_featured",
            "is_on_sale",
            "sale_percentage",
            "primary_image_url",
            "tags",
            "average_rating",
            "review_count",
            "created_at",
        ]

    def get_primary_image_url(self, obj):
        request = self.context.get("request")
        primary = obj.images.filter(is_primary=True).first()
        if primary and primary.image:
            return request.build_absolute_uri(primary.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    franchise = FranchiseSerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    related_products = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "category",
            "franchise",
            "brand",
            "sku",
            "base_price",
            "compare_price",
            "has_variants",
            "stock",
            "low_stock_threshold",
            "is_new",
            "is_featured",
            "is_on_sale",
            "sale_percentage",
            "weight_grams",
            "dimensions",
            "tags",
            "images",
            "variants",
            "related_products",
            "average_rating",
            "review_count",
            "created_at",
        ]

    def get_related_products(self, obj):
        related = (
            Product.objects.filter(
                franchise=obj.franchise,
                is_active=True,
            )
            .exclude(pk=obj.pk)[:4]
        )
        return ProductListSerializer(
            related, many=True, context=self.context
        ).data
