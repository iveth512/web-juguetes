from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.products.views import (
    BrandViewSet,
    CategoryViewSet,
    FranchiseViewSet,
    ProductViewSet,
    SearchView,
)
from .api_admin import AdminProductListCreate, AdminProductDetail, AdminCategoriesListView

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("categories", CategoryViewSet, basename="category")
router.register("franchises", FranchiseViewSet, basename="franchise")
router.register("brands", BrandViewSet, basename="brand")

urlpatterns = [
    path("search/", SearchView.as_view(), name="product-search"),
    path("admin/products/", AdminProductListCreate.as_view(), name="admin-product-list"),
    path("admin/products/<uuid:pk>/", AdminProductDetail.as_view(), name="admin-product-detail"),
    path("admin/options/", AdminCategoriesListView.as_view(), name="admin-options"),
    path("", include(router.urls)),
]
