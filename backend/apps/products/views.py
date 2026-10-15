from django.contrib.postgres.search import SearchRank, SearchVector
from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.products.filters import ProductFilter
from apps.products.models import Brand, Category, Franchise, Product
from apps.products.serializers import (
    BrandSerializer,
    CategorySerializer,
    FranchiseSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from core.pagination import StandardPagination


class ProductViewSet(ReadOnlyModelViewSet):
    filterset_class = ProductFilter
    ordering_fields = ["base_price", "created_at", "name"]
    ordering = ["-created_at"]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category", "franchise", "brand")
            .prefetch_related("images")
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @action(detail=False, methods=["get"], url_path="featured")
    def featured(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(
            is_featured=True
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="new", url_name="new")
    def new_products(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(
            is_new=True
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="on-sale", url_name="on-sale")
    def on_sale(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(
            is_on_sale=True
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "")
        if len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vector = (
            SearchVector("name", weight="A", config="spanish")
            + SearchVector("short_description", weight="B", config="spanish")
            + SearchVector("description", weight="C", config="spanish")
        )
        rank = SearchRank(vector, query)

        queryset = (
            Product.objects.filter(is_active=True)
            .annotate(rank=rank)
            .filter(rank__gt=0)
            .order_by("-rank")
            .select_related("category", "franchise", "brand")
            .prefetch_related("images")
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProductListSerializer(
            page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)


class CategoryViewSet(ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).annotate(
            product_count=Count(
                "products", filter=Q(products__is_active=True)
            )
        )


class FranchiseViewSet(ReadOnlyModelViewSet):
    serializer_class = FranchiseSerializer
    queryset = Franchise.objects.filter(is_active=True)
    pagination_class = None


class BrandViewSet(ReadOnlyModelViewSet):
    serializer_class = BrandSerializer
    queryset = Brand.objects.filter(is_active=True)
    pagination_class = None
