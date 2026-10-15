from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.models import Coupon, Order, OrderItem
from apps.products.models import Brand, Category, Franchise, Product


def _create_user(**kwargs):
    defaults = {
        "email": "buyer@test.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
    }
    defaults.update(kwargs)
    return CustomUser.objects.create_user(**defaults)


def _create_product(**kwargs):
    cat = Category.objects.create(name="Figuras", slug="figuras")
    fran = Franchise.objects.create(name="Marvel", slug="marvel")
    brand = Brand.objects.create(name="Hasbro", slug="hasbro")
    defaults = {
        "name": "Spider-Man Figure",
        "slug": "spider-man-figure",
        "sku": "SPD-001",
        "base_price": Decimal("89000"),
        "stock": 10,
        "is_active": True,
        "category": cat,
        "franchise": fran,
        "brand": brand,
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


def _checkout_payload(product, **overrides):
    data = {
        "items": [
            {
                "product_id": str(product.id),
                "quantity": 1,
            }
        ],
        "shipping_name": "Juan Perez",
        "shipping_phone": "3001234567",
        "shipping_address": "Calle 123 #45-67",
        "shipping_city": "Bogota",
        "shipping_department": "Cundinamarca",
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
class TestCheckoutSuccess:
    def test_checkout_success(self):
        user = _create_user()
        product = _create_product()
        client = APIClient()
        client.force_authenticate(user=user)

        payload = _checkout_payload(product)
        response = client.post("/api/v1/checkout/", payload, format="json")

        assert response.status_code == 201
        data = response.data
        assert data["status"] == "pending"
        assert Decimal(data["subtotal"]) == Decimal("89000.00")
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 1

        # Stock should be decremented
        product.refresh_from_db()
        assert product.stock == 9

        # Order should exist in DB
        assert Order.objects.filter(user=user).count() == 1

    def test_checkout_multiple_items(self):
        user = _create_user()
        product = _create_product(stock=20)
        client = APIClient()
        client.force_authenticate(user=user)

        payload = _checkout_payload(product)
        payload["items"][0]["quantity"] = 3
        response = client.post("/api/v1/checkout/", payload, format="json")

        assert response.status_code == 201
        assert Decimal(response.data["subtotal"]) == Decimal("267000.00")

        product.refresh_from_db()
        assert product.stock == 17


@pytest.mark.django_db
class TestCheckoutInsufficientStock:
    def test_checkout_insufficient_stock(self):
        user = _create_user()
        product = _create_product(stock=2)
        client = APIClient()
        client.force_authenticate(user=user)

        payload = _checkout_payload(product)
        payload["items"][0]["quantity"] = 5
        response = client.post("/api/v1/checkout/", payload, format="json")

        assert response.status_code == 400
        assert "stock insuficiente" in response.data["detail"]

        # Stock should not be changed
        product.refresh_from_db()
        assert product.stock == 2


@pytest.mark.django_db
class TestCheckoutWithCoupon:
    def test_checkout_with_coupon(self):
        user = _create_user()
        product = _create_product(base_price=Decimal("100000"), stock=10)
        coupon = Coupon.objects.create(
            code="SAVE20",
            discount_type="percentage",
            discount_value=Decimal("20"),
            valid_from=timezone.now() - timedelta(days=1),
            valid_until=timezone.now() + timedelta(days=30),
            is_active=True,
        )
        client = APIClient()
        client.force_authenticate(user=user)

        payload = _checkout_payload(product, coupon_code="save20")
        response = client.post("/api/v1/checkout/", payload, format="json")

        assert response.status_code == 201
        data = response.data
        assert Decimal(data["subtotal"]) == Decimal("100000.00")
        assert Decimal(data["discount"]) == Decimal("20000.00")
        # shipping: 100000 < 250000 so shipping = 12000
        assert Decimal(data["shipping_cost"]) == Decimal("12000.00")
        assert Decimal(data["total"]) == Decimal("92000.00")

        coupon.refresh_from_db()
        assert coupon.times_used == 1


@pytest.mark.django_db
class TestCheckoutRequiresAuth:
    def test_checkout_requires_auth(self):
        client = APIClient()
        response = client.post(
            "/api/v1/checkout/",
            {"items": [], "shipping_name": "X", "shipping_phone": "1",
             "shipping_address": "A", "shipping_city": "B",
             "shipping_department": "C"},
            format="json",
        )
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestOrderHistory:
    def test_order_history(self):
        user = _create_user()
        product = _create_product()
        client = APIClient()
        client.force_authenticate(user=user)

        # Create an order via checkout
        payload = _checkout_payload(product)
        client.post("/api/v1/checkout/", payload, format="json")

        # Fetch order history
        response = client.get("/api/v1/orders/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["status"] == "pending"


@pytest.mark.django_db
class TestOrderDetail:
    def test_order_detail(self):
        user = _create_user()
        product = _create_product()
        client = APIClient()
        client.force_authenticate(user=user)

        # Create an order
        payload = _checkout_payload(product)
        create_resp = client.post("/api/v1/checkout/", payload, format="json")
        order_id = create_resp.data["id"]

        # Fetch detail
        response = client.get(f"/api/v1/orders/{order_id}/")
        assert response.status_code == 200
        assert response.data["id"] == order_id
        assert len(response.data["items"]) == 1
        assert response.data["items"][0]["product_name"] == "Spider-Man Figure"

    def test_order_detail_not_found(self):
        user = _create_user()
        client = APIClient()
        client.force_authenticate(user=user)

        import uuid
        response = client.get(f"/api/v1/orders/{uuid.uuid4()}/")
        assert response.status_code == 404



@pytest.mark.django_db
class TestStaffCannotBuy:
    MESSAGE = "Las cuentas de administrador no pueden realizar compras."

    def test_staff_checkout_is_forbidden(self):
        staff = _create_user(email="staff@test.com", is_staff=True)
        product = _create_product()
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post("/api/v1/checkout/", _checkout_payload(product), format="json")

        assert response.status_code == 403
        assert response.data["detail"] == self.MESSAGE
        assert not Order.objects.exists()
        product.refresh_from_db()
        assert product.stock == 10

    def test_staff_cannot_start_a_payment(self):
        staff = _create_user(email="staff@test.com", is_staff=True)
        order = Order.objects.create(user=staff, total=Decimal("90000"))
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post(f"/api/v1/payments/init/{order.id}/")

        assert response.status_code == 403
        assert response.data["detail"] == self.MESSAGE

    def test_customer_still_buys(self):
        user = _create_user()
        product = _create_product()
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post("/api/v1/checkout/", _checkout_payload(product), format="json")

        assert response.status_code == 201
