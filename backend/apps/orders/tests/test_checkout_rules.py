from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from apps.orders.models import Coupon, Order
from apps.orders.services import release_order
from apps.orders.tests.test_checkout_api import (
    _checkout_payload,
    _create_product,
    _create_user,
)
from apps.products.models import ProductVariant
from apps.shipping.models import ShippingZone


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _coupon(**kwargs):
    defaults = dict(
        code="SAVE20",
        discount_type="percentage",
        discount_value=Decimal("20"),
        valid_from=timezone.now() - timedelta(days=1),
        valid_until=timezone.now() + timedelta(days=30),
    )
    defaults.update(kwargs)
    return Coupon.objects.create(**defaults)


def _zones():
    for name, price in [("Bogota", "8900"), ("Medellin", "12900"), ("Resto del pais", "18900")]:
        ShippingZone.objects.create(
            name=name, price=Decimal(price), min_days=1, max_days=3,
            free_shipping_threshold=Decimal("250000"),
        )


@pytest.mark.django_db
class TestVariants:
    def test_variant_price_and_stock_are_used(self):
        user = _create_user()
        product = _create_product(has_variants=True, base_price=Decimal("50000"))
        variant = ProductVariant.objects.create(
            product=product, name="Edicion especial", sku="SPD-001-EE",
            price=Decimal("120000"), stock=3,
        )
        payload = _checkout_payload(product)
        payload["items"][0]["variant_id"] = str(variant.id)
        payload["items"][0]["quantity"] = 2

        resp = _client(user).post("/api/v1/checkout/", payload, format="json")

        assert resp.status_code == 201
        assert Decimal(resp.data["subtotal"]) == Decimal("240000")
        assert resp.data["items"][0]["variant_name"] == "Edicion especial"
        variant.refresh_from_db()
        product.refresh_from_db()
        assert variant.stock == 1
        assert product.stock == 1  # synced from variants

    def test_product_with_variants_requires_variant(self):
        user = _create_user()
        product = _create_product(has_variants=True)
        resp = _client(user).post("/api/v1/checkout/", _checkout_payload(product), format="json")
        assert resp.status_code == 400
        assert "variante" in resp.data["detail"]


@pytest.mark.django_db
class TestCoupons:
    def test_invalid_coupon_rejects_checkout(self):
        user = _create_user()
        product = _create_product(stock=5)
        payload = _checkout_payload(product, coupon_code="NOEXISTE")

        resp = _client(user).post("/api/v1/checkout/", payload, format="json")

        assert resp.status_code == 400
        assert Order.objects.count() == 0
        product.refresh_from_db()
        assert product.stock == 5

    def test_expired_coupon_rejects_checkout(self):
        user = _create_user()
        product = _create_product()
        _coupon(valid_until=timezone.now() - timedelta(hours=1))
        resp = _client(user).post(
            "/api/v1/checkout/", _checkout_payload(product, coupon_code="SAVE20"), format="json",
        )
        assert resp.status_code == 400
        assert "expirado" in resp.data["detail"]

    def test_percentage_discount_is_rounded_to_pesos(self):
        user = _create_user()
        product = _create_product(base_price=Decimal("33333"))
        _coupon(discount_value=Decimal("15"))
        resp = _client(user).post(
            "/api/v1/checkout/", _checkout_payload(product, coupon_code="SAVE20"), format="json",
        )
        assert resp.status_code == 201
        assert Decimal(resp.data["discount"]) == Decimal("5000")  # 4999.95 -> 5000
        assert Decimal(resp.data["total"]) % 1 == 0


@pytest.mark.django_db
class TestShipping:
    @pytest.mark.parametrize("city,expected", [
        ("Bogotá", "8900"),
        ("  medellin ", "12900"),
        ("Pasto", "18900"),
    ])
    def test_shipping_by_zone(self, city, expected):
        _zones()
        user = _create_user()
        product = _create_product()
        payload = _checkout_payload(product, shipping_city=city)
        resp = _client(user).post("/api/v1/checkout/", payload, format="json")
        assert resp.status_code == 201
        assert Decimal(resp.data["shipping_cost"]) == Decimal(expected)

    def test_free_shipping_over_threshold(self):
        _zones()
        user = _create_user()
        product = _create_product(base_price=Decimal("260000"))
        resp = _client(user).post("/api/v1/checkout/", _checkout_payload(product), format="json")
        assert Decimal(resp.data["shipping_cost"]) == 0


@pytest.mark.django_db
class TestQuote:
    def test_quote_matches_checkout(self):
        _zones()
        user = _create_user()
        product = _create_product(base_price=Decimal("100000"), stock=10)
        _coupon()
        payload = _checkout_payload(product, coupon_code="SAVE20", shipping_city="Medellín")
        client = _client(user)

        quote = client.post("/api/v1/checkout/quote/", {
            "items": payload["items"], "shipping_city": "Medellín", "coupon_code": "SAVE20",
        }, format="json")
        order = client.post("/api/v1/checkout/", payload, format="json")

        assert quote.status_code == 200
        for key in ("subtotal", "discount", "shipping_cost", "total"):
            assert Decimal(quote.data[key]) == Decimal(order.data[key])

    def test_quote_does_not_reserve_stock(self):
        product = _create_product(stock=4)
        resp = APIClient().post("/api/v1/checkout/quote/", {
            "items": [{"product_id": str(product.id), "quantity": 2}],
        }, format="json")
        assert resp.status_code == 200
        product.refresh_from_db()
        assert product.stock == 4


@pytest.mark.django_db
class TestMinimumTotal:
    def test_total_below_bold_minimum_is_rejected(self):
        ShippingZone.objects.create(
            name="Resto del pais", price=Decimal("0"), min_days=1, max_days=2,
        )
        user = _create_user()
        product = _create_product(base_price=Decimal("500"))
        resp = _client(user).post("/api/v1/checkout/", _checkout_payload(product), format="json")
        assert resp.status_code == 400
        assert "mínimo" in resp.data["detail"]


@pytest.mark.django_db
class TestReleaseOrder:
    def _order(self, quantity=2):
        user = _create_user()
        product = _create_product(stock=10)
        coupon = _coupon()
        payload = _checkout_payload(product, coupon_code="SAVE20")
        payload["items"][0]["quantity"] = quantity
        resp = _client(user).post("/api/v1/checkout/", payload, format="json")
        return Order.objects.get(pk=resp.data["id"]), product, coupon, user

    def test_release_restores_stock_and_coupon_once(self):
        order, product, coupon, _ = self._order()

        assert release_order(order) is True
        assert release_order(order) is False  # second call is a no-op

        order.refresh_from_db()
        product.refresh_from_db()
        coupon.refresh_from_db()
        assert order.status == Order.Status.CANCELLED
        assert product.stock == 10
        assert coupon.times_used == 0

    def test_customer_can_cancel_pending_order(self):
        order, product, _, user = self._order()
        resp = _client(user).post(f"/api/v1/orders/{order.id}/cancel/")
        assert resp.status_code == 200
        assert resp.data["status"] == "cancelled"
        product.refresh_from_db()
        assert product.stock == 10

    def test_other_user_cannot_cancel(self):
        order, _, _, _ = self._order()
        intruder = _create_user(email="otro@test.com")
        resp = _client(intruder).post(f"/api/v1/orders/{order.id}/cancel/")
        assert resp.status_code == 404

    def test_expired_orders_are_released_by_command(self):
        order, product, _, _ = self._order()
        Order.objects.filter(pk=order.pk).update(created_at=timezone.now() - timedelta(hours=3))

        with patch("apps.payments.bold.fetch_notifications", return_value=[]):
            call_command("process_pending_orders")

        order.refresh_from_db()
        product.refresh_from_db()
        assert order.status == Order.Status.CANCELLED
        assert product.stock == 10

    def test_recent_orders_are_not_released(self):
        order, product, _, _ = self._order()
        with patch("apps.payments.bold.fetch_notifications", return_value=[]):
            call_command("process_pending_orders")
        order.refresh_from_db()
        assert order.status == Order.Status.PENDING
