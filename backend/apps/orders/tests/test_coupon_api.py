import pytest
from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient

from apps.orders.models import Coupon


@pytest.fixture
def valid_coupon():
    return Coupon.objects.create(
        code="DESCUENTO20",
        discount_type="percentage",
        discount_value=Decimal("20"),
        valid_from=timezone.now() - timedelta(days=1),
        valid_until=timezone.now() + timedelta(days=30),
        is_active=True,
    )


@pytest.mark.django_db
class TestCouponValidateAPI:
    def setup_method(self):
        self.client = APIClient()
        self.url = "/api/v1/coupons/validate/"

    def test_valid_coupon(self, valid_coupon):
        response = self.client.post(
            self.url,
            {"code": "DESCUENTO20", "subtotal": "100000"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["code"] == "DESCUENTO20"
        assert response.data["discount_amount"] == "20000"

    def test_case_insensitive(self, valid_coupon):
        response = self.client.post(
            self.url,
            {"code": "descuento20", "subtotal": "100000"},
            format="json",
        )
        assert response.status_code == 200

    def test_invalid_code(self):
        response = self.client.post(
            self.url,
            {"code": "NOEXISTE", "subtotal": "100000"},
            format="json",
        )
        assert response.status_code == 400

    def test_min_purchase_not_met(self):
        Coupon.objects.create(
            code="MINIMO",
            discount_type="fixed",
            discount_value=Decimal("10000"),
            min_purchase=Decimal("200000"),
            valid_from=timezone.now() - timedelta(days=1),
            valid_until=timezone.now() + timedelta(days=30),
            is_active=True,
        )
        response = self.client.post(
            self.url,
            {"code": "MINIMO", "subtotal": "50000"},
            format="json",
        )
        assert response.status_code == 400
        assert "mínimo" in response.data["detail"]
