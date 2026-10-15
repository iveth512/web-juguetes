from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.models import Order, OrderItem
from apps.orders.tests.test_checkout_api import _create_product
from apps.products.models import Product

TZ = timezone.get_current_timezone()


@pytest.fixture
def admin_client():
    admin = CustomUser.objects.create_superuser(
        email="admin@test.com", password="x", first_name="A", last_name="B",
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def buyer():
    return CustomUser.objects.create_user(
        email="cliente@test.com", password="x", first_name="Ana", last_name="Gomez",
    )


def _at(day, hour=12):
    """Aware datetime in the store's time zone (America/Bogota)."""
    return timezone.make_aware(datetime.combine(day, datetime.min.time()) + timedelta(hours=hour), TZ)


def _sale(user, product, day, qty=1, price="10000", status=Order.Status.PAID, hour=12, **kwargs):
    total = Decimal(price) * qty
    order = Order.objects.create(
        user=user, total=total, subtotal=total, status=status, paid_at=_at(day, hour), **kwargs,
    )
    OrderItem.objects.create(order=order, product=product, quantity=qty, price=Decimal(price))
    return order


@pytest.mark.django_db
class TestAccess:
    @pytest.mark.parametrize("url", [
        "/api/v1/admin/dashboard/summary/",
        "/api/v1/admin/dashboard/sales-by-day/",
        "/api/v1/admin/dashboard/sales-by-product/",
        "/api/v1/admin/orders/",
    ])
    def test_customers_and_anonymous_are_refused(self, url, buyer):
        client = APIClient()
        assert client.get(url).status_code in (401, 403)
        client.force_authenticate(user=buyer)
        assert client.get(url).status_code == 403


@pytest.mark.django_db
class TestSummary:
    def test_counts_only_paid_sales_in_range(self, admin_client, buyer):
        product = _create_product()
        today = timezone.localdate()
        _sale(buyer, product, today, qty=2, price="50000")
        _sale(buyer, product, today, qty=1, price="30000", status=Order.Status.SHIPPED)
        _sale(buyer, product, today, qty=5, status=Order.Status.PENDING)    # not a sale
        _sale(buyer, product, today, qty=5, status=Order.Status.CANCELLED)  # not a sale
        _sale(buyer, product, today - timedelta(days=60), qty=9)             # out of range

        resp = admin_client.get("/api/v1/admin/dashboard/summary/")

        assert resp.status_code == 200
        assert Decimal(resp.data["ventas_total"]) == Decimal("130000")
        assert resp.data["pedidos"] == 2
        assert Decimal(resp.data["ticket_promedio"]) == Decimal("65000")
        assert resp.data["unidades_vendidas"] == 3
        assert resp.data["clientes"] == 1
        assert resp.data["pedidos_pendientes_pago"] == 1
        assert resp.data["pedidos_por_despachar"] == 2  # the PAID ones (incl. out of range)

    def test_sales_are_net_of_shipping_and_discounts(self, admin_client, buyer):
        product = _create_product()
        today = timezone.localdate()
        order = _sale(buyer, product, today, qty=2, price="50000")  # subtotal 100.000
        Order.objects.filter(pk=order.pk).update(
            discount=Decimal("10000"), shipping_cost=Decimal("8900"), total=Decimal("98900"),
        )

        summary = admin_client.get("/api/v1/admin/dashboard/summary/").data
        assert summary["ventas_total"] == "90000.00"
        assert summary["ticket_promedio"] == "90000.00"
        assert summary["descuentos"] == "10000.00"
        assert summary["envios_cobrados"] == "8900.00"
        assert summary["total_cobrado"] == "98900.00"

        day = admin_client.get(f"/api/v1/admin/dashboard/sales-by-day/?desde={today}&hasta={today}").data
        assert day["dias"][0]["total"] == "90000.00"

    def test_empty_range_returns_zeros(self, admin_client):
        resp = admin_client.get("/api/v1/admin/dashboard/summary/")
        assert resp.data["pedidos"] == 0
        assert Decimal(resp.data["ventas_total"]) == 0

    def test_low_stock_counter(self, admin_client):
        _create_product(stock=2)  # threshold defaults to 5
        resp = admin_client.get("/api/v1/admin/dashboard/summary/")
        assert resp.data["productos_bajo_stock"] == 1


@pytest.mark.django_db
class TestSalesByDay:
    def test_fills_every_day_with_zeros(self, admin_client, buyer):
        product = _create_product()
        day = timezone.localdate() - timedelta(days=2)
        _sale(buyer, product, day, qty=2, price="10000")
        _sale(buyer, product, day, qty=1, price="5000")

        resp = admin_client.get(
            f"/api/v1/admin/dashboard/sales-by-day/?desde={(day - timedelta(days=1)).isoformat()}"
            f"&hasta={(day + timedelta(days=1)).isoformat()}"
        )

        assert resp.status_code == 200
        dias = resp.data["dias"]
        assert [d["fecha"] for d in dias] == [
            (day - timedelta(days=1)).isoformat(), day.isoformat(), (day + timedelta(days=1)).isoformat(),
        ]
        assert [Decimal(d["total"]) for d in dias] == [0, Decimal("25000"), 0]
        assert [d["pedidos"] for d in dias] == [0, 2, 0]

    def test_days_use_colombia_time(self, admin_client, buyer):
        # 11 p.m. in Bogota is already the next day in UTC: it must count for the local day.
        product = _create_product()
        day = timezone.localdate() - timedelta(days=1)
        _sale(buyer, product, day, hour=23)
        resp = admin_client.get(f"/api/v1/admin/dashboard/sales-by-day/?desde={day}&hasta={day}")
        assert resp.data["dias"][0]["pedidos"] == 1

    def test_default_range_is_30_days(self, admin_client):
        resp = admin_client.get("/api/v1/admin/dashboard/sales-by-day/")
        assert len(resp.data["dias"]) == 30
        assert resp.data["hasta"] == timezone.localdate().isoformat()

    @pytest.mark.parametrize("query,message", [
        ("desde=2026-13-01", "formato"),
        ("desde=2026-05-10&hasta=2026-05-01", "posterior"),
        ("desde=2024-01-01&hasta=2026-01-01", "maximo"),
    ])
    def test_invalid_ranges(self, admin_client, query, message):
        resp = admin_client.get(f"/api/v1/admin/dashboard/sales-by-day/?{query}")
        assert resp.status_code == 400
        assert message in resp.data["detail"]


@pytest.mark.django_db
class TestSalesByProduct:
    def test_ranks_products_by_revenue(self, admin_client, buyer):
        cheap = _create_product()
        pricey = Product.objects.create(
            name="Estatua", slug="estatua", sku="EST-1", base_price=Decimal("400000"),
            category=cheap.category, franchise=cheap.franchise, brand=cheap.brand,
        )
        today = timezone.localdate()
        _sale(buyer, cheap, today, qty=5, price="10000")     # 50.000
        _sale(buyer, pricey, today, qty=1, price="400000")   # 400.000
        _sale(buyer, pricey, today, qty=3, status=Order.Status.CANCELLED)

        resp = admin_client.get("/api/v1/admin/dashboard/sales-by-product/")

        productos = resp.data["productos"]
        assert [p["nombre"] for p in productos] == ["Estatua", cheap.name]
        assert productos[0]["unidades"] == 1
        assert Decimal(productos[0]["ingresos"]) == Decimal("400000")
        assert productos[1]["unidades"] == 5

    def test_limit(self, admin_client, buyer):
        product = _create_product()
        _sale(buyer, product, timezone.localdate())
        resp = admin_client.get("/api/v1/admin/dashboard/sales-by-product/?limite=0")
        assert len(resp.data["productos"]) == 1


@pytest.mark.django_db
class TestOrderHistory:
    def test_lists_sales_newest_first_with_details(self, admin_client, buyer):
        product = _create_product()
        today = timezone.localdate()
        older = _sale(buyer, product, today - timedelta(days=3), shipping_name="Ana Gomez")
        newer = _sale(buyer, product, today, qty=2, shipping_name="Ana Gomez")
        _sale(buyer, product, today, status=Order.Status.PENDING)

        resp = admin_client.get("/api/v1/admin/orders/")

        assert resp.status_code == 200
        ids = [o["id"] for o in resp.data["results"]]
        assert ids == [str(newer.id), str(older.id)]
        first = resp.data["results"][0]
        assert first["cliente_email"] == "cliente@test.com"
        assert first["unidades"] == 2
        assert first["productos"][0]["cantidad"] == 2

    def test_filter_by_status(self, admin_client, buyer):
        product = _create_product()
        today = timezone.localdate()
        _sale(buyer, product, today)
        pending = _sale(buyer, product, today, status=Order.Status.PENDING)
        resp = admin_client.get("/api/v1/admin/orders/?estado=pending")
        assert [o["id"] for o in resp.data["results"]] == [str(pending.id)]
        assert admin_client.get("/api/v1/admin/orders/?estado=todos").data["count"] == 2

    def test_search_by_email_and_short_id(self, admin_client, buyer):
        product = _create_product()
        other = CustomUser.objects.create_user(email="otro@test.com", password="x", first_name="O", last_name="O")
        mine = _sale(buyer, product, timezone.localdate())
        _sale(other, product, timezone.localdate())

        by_email = admin_client.get("/api/v1/admin/orders/?q=cliente@")
        assert [o["id"] for o in by_email.data["results"]] == [str(mine.id)]
        by_id = admin_client.get(f"/api/v1/admin/orders/?q={str(mine.id)[:8].upper()}")
        assert [o["id"] for o in by_id.data["results"]] == [str(mine.id)]

    def test_invalid_status(self, admin_client):
        assert admin_client.get("/api/v1/admin/orders/?estado=xx").status_code == 400


@pytest.mark.django_db
class TestAdminOrderStatus:
    def _url(self, order):
        return f"/api/v1/admin/orders/{order.id}/"

    def test_paid_to_shipped_with_tracking_then_delivered(self, admin_client, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate())

        resp = admin_client.patch(self._url(order), {"status": "shipped", "tracking_number": " GU123 "}, format="json")
        assert resp.status_code == 200, resp.data
        assert resp.data["status"] == "shipped"
        assert resp.data["tracking_number"] == "GU123"
        order.refresh_from_db()
        assert order.shipped_at is not None

        resp = admin_client.patch(self._url(order), {"status": "delivered"}, format="json")
        assert resp.status_code == 200
        assert resp.data["status"] == "delivered"

    @pytest.mark.parametrize("start,target", [
        (Order.Status.PAID, "delivered"),
        (Order.Status.PENDING, "shipped"),
        (Order.Status.DELIVERED, "shipped"),
        (Order.Status.CANCELLED, "shipped"),
    ])
    def test_invalid_transitions_are_rejected(self, admin_client, buyer, start, target):
        order = _sale(buyer, _create_product(), timezone.localdate(), status=start)
        resp = admin_client.patch(self._url(order), {"status": target}, format="json")
        assert resp.status_code == 400
        assert "status" in resp.data
        order.refresh_from_db()
        assert order.status == start

    def test_status_must_be_shipped_or_delivered(self, admin_client, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate())
        resp = admin_client.patch(self._url(order), {"status": "refunded"}, format="json")
        assert resp.status_code == 400

    def test_tracking_needs_a_shipped_order(self, admin_client, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate())
        resp = admin_client.patch(self._url(order), {"tracking_number": "GU1"}, format="json")
        assert resp.status_code == 400

    def test_tracking_can_be_corrected_after_shipping(self, admin_client, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate(), status=Order.Status.SHIPPED)
        resp = admin_client.patch(self._url(order), {"tracking_number": "GU2"}, format="json")
        assert resp.status_code == 200
        assert resp.data["tracking_number"] == "GU2"

    def test_empty_body_and_unknown_order(self, admin_client, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate())
        assert admin_client.patch(self._url(order), {}, format="json").status_code == 400
        missing = "/api/v1/admin/orders/00000000-0000-0000-0000-000000000000/"
        assert admin_client.patch(missing, {"status": "shipped"}, format="json").status_code == 404

    def test_customers_cannot_update(self, buyer):
        order = _sale(buyer, _create_product(), timezone.localdate())
        client = APIClient()
        client.force_authenticate(user=buyer)
        assert client.patch(self._url(order), {"status": "shipped"}, format="json").status_code == 403
