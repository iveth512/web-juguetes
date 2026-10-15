import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.products.models import Category, Franchise, Brand, Product

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create_user(
        email="wishuser@example.com",
        password="TestPass123",
        first_name="Wish",
        last_name="User",
    )

@pytest.fixture
def product():
    cat = Category.objects.create(name="Test Cat")
    franchise = Franchise.objects.create(name="Test Franchise")
    brand = Brand.objects.create(name="Test Brand")
    return Product.objects.create(
        name="Test Product",
        category=cat,
        franchise=franchise,
        brand=brand,
        base_price=50000,
        stock=10,
    )

@pytest.mark.django_db
class TestWishlistAPI:
    def test_add_to_wishlist(self, user, product):
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post("/api/v1/wishlist/", {"product_id": str(product.id)}, format="json")
        assert response.status_code == 201

    def test_list_wishlist(self, user, product):
        client = APIClient()
        client.force_authenticate(user=user)
        client.post("/api/v1/wishlist/", {"product_id": str(product.id)}, format="json")
        response = client.get("/api/v1/wishlist/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Test Product"

    def test_remove_from_wishlist(self, user, product):
        client = APIClient()
        client.force_authenticate(user=user)
        client.post("/api/v1/wishlist/", {"product_id": str(product.id)}, format="json")
        response = client.delete(f"/api/v1/wishlist/{product.id}/")
        assert response.status_code == 204

    def test_wishlist_requires_auth(self):
        client = APIClient()
        response = client.get("/api/v1/wishlist/")
        assert response.status_code == 401

    def test_no_duplicate_wishlist(self, user, product):
        client = APIClient()
        client.force_authenticate(user=user)
        client.post("/api/v1/wishlist/", {"product_id": str(product.id)}, format="json")
        response = client.post("/api/v1/wishlist/", {"product_id": str(product.id)}, format="json")
        assert response.status_code == 200
