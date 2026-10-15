from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.orders.models import Coupon


def _make_coupon(**kwargs):
    """Helper to create a Coupon with sensible defaults."""
    now = timezone.now()
    defaults = {
        "code": "TEST",
        "discount_type": Coupon.DiscountType.PERCENTAGE,
        "discount_value": Decimal("10"),
        "valid_from": now - timedelta(days=1),
        "valid_until": now + timedelta(days=30),
    }
    defaults.update(kwargs)
    return Coupon.objects.create(**defaults)


@pytest.mark.django_db
class TestCoupon:

    def test_code_uppercased(self):
        coupon = _make_coupon(code="descuento10")
        assert coupon.code == "DESCUENTO10"

    def test_percentage_discount(self):
        coupon = _make_coupon(
            discount_type=Coupon.DiscountType.PERCENTAGE,
            discount_value=Decimal("20"),
        )
        assert coupon.calculate_discount(100_000) == Decimal("20000")

    def test_fixed_discount(self):
        coupon = _make_coupon(
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal("15000"),
        )
        assert coupon.calculate_discount(100_000) == Decimal("15000")

    def test_fixed_discount_capped_at_subtotal(self):
        coupon = _make_coupon(
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal("50000"),
        )
        assert coupon.calculate_discount(30_000) == Decimal("30000")

    def test_valid_coupon(self):
        coupon = _make_coupon()
        valid, msg = coupon.is_valid(subtotal=100_000)
        assert valid is True

    def test_expired_coupon(self):
        now = timezone.now()
        coupon = _make_coupon(
            code="EXPIRED",
            valid_from=now - timedelta(days=30),
            valid_until=now - timedelta(days=1),
        )
        valid, msg = coupon.is_valid()
        assert valid is False
        assert "expirado" in msg.lower()

    def test_inactive_coupon(self):
        coupon = _make_coupon(code="INACTIVE", is_active=False)
        valid, msg = coupon.is_valid()
        assert valid is False

    def test_min_purchase_not_met(self):
        coupon = _make_coupon(
            code="MINPURCHASE",
            min_purchase=Decimal("200000"),
        )
        valid, msg = coupon.is_valid(subtotal=100_000)
        assert valid is False
        assert "mínimo" in msg.lower()

    def test_max_uses_reached(self):
        coupon = _make_coupon(
            code="MAXUSES",
            max_uses=5,
            times_used=5,
        )
        valid, msg = coupon.is_valid()
        assert valid is False
        assert "agotado" in msg.lower()
