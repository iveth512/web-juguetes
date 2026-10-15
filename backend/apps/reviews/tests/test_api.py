import pytest
from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.models import Order, OrderItem
from apps.products.models import Brand, Category, Franchise, Product
from apps.reviews.models import Review


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def product(db):
    category = Category.objects.create(name="Figuras", slug="figuras")
    franchise = Franchise.objects.create(name="Marvel", slug="marvel")
    brand = Brand.objects.create(name="Hasbro", slug="hasbro")
    return Product.objects.create(
        name="Test Product",
        slug="test-product",
        category=category,
        franchise=franchise,
        brand=brand,
        sku="TEST-001",
        base_price=Decimal("50000"),
        stock=10,
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestReviewsAPI:

    def test_create_review(self, auth_client, product):
        url = reverse("review-list")
        data = {
            "product_id": str(product.id),
            "rating": 5,
            "title": "Excelente",
            "comment": "Muy buen producto",
        }
        response = auth_client.post(url, data, format="json")
        assert response.status_code == 201
        review = Review.objects.first()
        assert review.is_verified_purchase is False

    def test_verified_purchase_review(self, auth_client, user, product):
        order = Order.objects.create(
            user=user, status="delivered", total=Decimal("50000")
        )
        OrderItem.objects.create(
            order=order, product=product, quantity=1, price=Decimal("50000")
        )
        url = reverse("review-list")
        data = {
            "product_id": str(product.id),
            "rating": 4,
            "title": "Bueno",
            "comment": "Compra verificada",
        }
        response = auth_client.post(url, data, format="json")
        assert response.status_code == 201
        review = Review.objects.first()
        assert review.is_verified_purchase is True

    def test_list_reviews(self, auth_client, user, product):
        Review.objects.create(
            user=user,
            product=product,
            rating=5,
            title="Genial",
            comment="Me encanta",
        )
        url = reverse("review-list")
        response = auth_client.get(url, {"product": product.slug})
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_no_duplicate_review(self, auth_client, user, product):
        Review.objects.create(
            user=user,
            product=product,
            rating=5,
            title="Primera",
            comment="Primera resena",
        )
        url = reverse("review-list")
        data = {
            "product_id": str(product.id),
            "rating": 3,
            "title": "Segunda",
            "comment": "Intento duplicado",
        }
        response = auth_client.post(url, data, format="json")
        assert response.status_code == 400

    def test_delete_own_review(self, auth_client, user, product):
        review = Review.objects.create(
            user=user,
            product=product,
            rating=5,
            title="Borrar",
            comment="Para borrar",
        )
        url = reverse("review-detail", kwargs={"pk": review.id})
        response = auth_client.delete(url)
        assert response.status_code == 204
        assert Review.objects.count() == 0

    def test_requires_auth(self, product):
        client = APIClient()
        url = reverse("review-list")
        data = {
            "product_id": str(product.id),
            "rating": 5,
            "title": "Sin auth",
            "comment": "No deberia funcionar",
        }
        response = client.post(url, data, format="json")
        assert response.status_code in (401, 403)

    def test_list_is_public(self, product):
        client = APIClient()
        url = reverse("review-list")
        response = client.get(url, {"product": product.slug})
        assert response.status_code == 200
