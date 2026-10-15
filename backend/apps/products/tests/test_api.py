from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.products.models import (
    Brand,
    Category,
    Franchise,
    Product,
    ProductImage,
    ProductVariant,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def sample_data():
    category = Category.objects.create(name="Figuras de Accion")
    franchise = Franchise.objects.create(name="Dragon Ball")
    brand = Brand.objects.create(name="Bandai")

    products = []
    for i in range(5):
        product = Product.objects.create(
            name=f"Test Product {i}",
            category=category,
            franchise=franchise,
            brand=brand,
            sku=f"TEST-{i:03d}",
            base_price=Decimal("50000") + Decimal(i * 10000),
            stock=i,  # product 0 has stock=0
            is_new=(i < 2),
            is_featured=(i == 0),
            is_on_sale=(i == 1),
            sale_percentage=10 if i == 1 else None,
        )
        products.append(product)

    # Add image and variant to first product
    ProductImage.objects.create(
        product=products[0],
        image="products/test.jpg",
        alt_text="Test image",
        is_primary=True,
    )
    ProductVariant.objects.create(
        product=products[0],
        name="Standard",
        sku="TEST-000-STD",
        price=Decimal("50000"),
        stock=5,
    )

    return {
        "category": category,
        "franchise": franchise,
        "brand": brand,
        "products": products,
    }


@pytest.mark.django_db
class TestProductListAPI:
    def test_list_products(self, api_client, sample_data):
        url = reverse("product-list")
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["count"] == 5

    def test_filter_by_category(self, api_client, sample_data):
        url = reverse("product-list")
        response = api_client.get(url, {"category": "figuras-de-accion"})
        assert response.status_code == 200
        assert response.data["count"] == 5

    def test_filter_in_stock(self, api_client, sample_data):
        url = reverse("product-list")
        response = api_client.get(url, {"in_stock": "true"})
        assert response.status_code == 200
        assert response.data["count"] == 4

    def test_filter_new(self, api_client, sample_data):
        url = reverse("product-list")
        response = api_client.get(url, {"is_new": "true"})
        assert response.status_code == 200
        assert response.data["count"] == 2

    def test_ordering_by_price(self, api_client, sample_data):
        url = reverse("product-list")
        response = api_client.get(url, {"ordering": "base_price"})
        assert response.status_code == 200
        prices = [
            Decimal(p["base_price"]) for p in response.data["results"]
        ]
        assert prices == sorted(prices)


@pytest.mark.django_db
class TestProductDetailAPI:
    def test_get_product_by_slug(self, api_client, sample_data):
        product = sample_data["products"][0]
        url = reverse("product-detail", kwargs={"slug": product.slug})
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["name"] == product.name
        assert "images" in response.data
        assert "variants" in response.data

    def test_product_not_found(self, api_client, sample_data):
        url = reverse("product-detail", kwargs={"slug": "does-not-exist"})
        response = api_client.get(url)
        assert response.status_code == 404


@pytest.mark.django_db
class TestProductSpecialEndpoints:
    def test_featured_products(self, api_client, sample_data):
        url = reverse("product-featured")
        response = api_client.get(url)
        assert response.status_code == 200
        for product in response.data["results"]:
            assert product["is_featured"] is True

    def test_new_products(self, api_client, sample_data):
        url = reverse("product-new")
        response = api_client.get(url)
        assert response.status_code == 200
        for product in response.data["results"]:
            assert product["is_new"] is True

    def test_on_sale_products(self, api_client, sample_data):
        url = reverse("product-on-sale")
        response = api_client.get(url)
        assert response.status_code == 200
        for product in response.data["results"]:
            assert product["is_on_sale"] is True


@pytest.mark.django_db
class TestCategoryAPI:
    def test_list_categories(self, api_client, sample_data):
        url = reverse("category-list")
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data) >= 1
        assert "product_count" in response.data[0]


@pytest.mark.django_db
class TestSearchAPI:
    def test_search_products(self, api_client, sample_data):
        url = reverse("product-search")
        response = api_client.get(url, {"q": "Test"})
        assert response.status_code == 200
        assert response.data["count"] >= 1

    def test_search_min_chars(self, api_client, sample_data):
        url = reverse("product-search")
        response = api_client.get(url, {"q": "T"})
        assert response.status_code == 400
