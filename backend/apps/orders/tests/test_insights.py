from datetime import date
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.orders.models import Coupon, Order
from apps.orders.tests.test_dashboard import _sale, admin_client, buyer  # noqa: F401
from apps.products.models import Brand, Category, Franchise, Product
from apps.shipping.models import ShippingZone

URL = "/api/v1/admin/dashboard/insights/"
RANGE = {"desde": "2026-03-02", "hasta": "2026-03-11"}  # 10 days, starts on a Monday
MONDAY = date(2026, 3, 2)


@pytest.fixture
def catalog():
    taxonomy = {
        "category": Category.objects.create(name="Funko Pop!"),
        "brand": Brand.objects.create(name="Funko"),
    }
    anime = Franchise.objects.create(name="Naruto")
    marvel = Franchise.objects.create(name="Marvel")

    def make(sku, franchise, stock=10, cost=None, price="10000"):
        product = Product.objects.create(
            name=f"Pop {sku}", sku=sku, base_price=Decimal(price), stock=stock, franchise=franchise, **taxonomy,
        )
        if cost is not None:  # computed from the import lot on save; set it directly here
            Product.objects.filter(pk=product.pk).update(total_cost_cop=Decimal(cost))
            product.refresh_from_db()
        return product

    return {
        "costed": make("A", anime, cost="6000"),
        "uncosted": make("B", marvel),
        "dormant": make("C", anime, stock=4, cost="5000", price="80000"),
        "sold_out": make("D", marvel, stock=0),
    }


def _get(client, **params):
    return client.get(URL, {**RANGE, **params})


@pytest.mark.django_db
class TestAccess:
    def test_customers_and_anonymous_are_refused(self, buyer):  # noqa: F811
        client = APIClient()
        assert client.get(URL).status_code == 401
        client.force_authenticate(user=buyer)
        assert client.get(URL).status_code == 403

    def test_invalid_range(self, admin_client):  # noqa: F811
        resp = admin_client.get(URL, {"desde": "2026-03-10", "hasta": "2026-03-01"})
        assert resp.status_code == 400


@pytest.mark.django_db
class TestInsights:
    def test_margin_per_product(self, admin_client, buyer, catalog):  # noqa: F811
        _sale(buyer, catalog["costed"], MONDAY, qty=2)
        _sale(buyer, catalog["uncosted"], MONDAY)

        data = _get(admin_client).data
        rows = {r["nombre"]: r for r in data["margen_por_producto"]}

        assert rows["Pop A"] == {
            "product_id": str(catalog["costed"].pk), "nombre": "Pop A", "franquicia": "Naruto",
            "unidades": 2, "ingresos": "20000.00", "costo": "12000.00", "utilidad": "8000.00", "margen_pct": 40.0,
        }
        assert rows["Pop B"]["costo"] is None and rows["Pop B"]["margen_pct"] is None
        assert data["utilidad_total"] == "8000.00"
        assert data["margen_promedio_pct"] == 40.0
        assert data["dias"] == 10

    def test_only_paid_sales_in_range_count(self, admin_client, buyer, catalog):  # noqa: F811
        _sale(buyer, catalog["costed"], MONDAY, status=Order.Status.PENDING)
        _sale(buyer, catalog["costed"], MONDAY, status=Order.Status.CANCELLED)
        _sale(buyer, catalog["costed"], date(2026, 2, 1))
        _sale(buyer, catalog["costed"], MONDAY, status=Order.Status.DELIVERED)

        data = _get(admin_client).data
        assert [r["unidades"] for r in data["margen_por_producto"]] == [1]
        assert len(data["subtotales"]) == 1

    def test_weekday_and_hour_use_store_time(self, admin_client, buyer, catalog):  # noqa: F811
        _sale(buyer, catalog["costed"], MONDAY, hour=15)
        _sale(buyer, catalog["costed"], date(2026, 3, 8), hour=23)  # Sunday, 23:00 Bogota

        data = _get(admin_client).data
        assert len(data["por_dia_semana"]) == 7 and len(data["por_hora"]) == 24
        assert data["por_dia_semana"][0] == {"dia": 0, "pedidos": 1, "ingresos": "10000.00"}
        assert data["por_dia_semana"][6]["pedidos"] == 1
        assert data["por_hora"][15]["pedidos"] == 1
        assert data["por_hora"][23]["pedidos"] == 1

    def test_coupons_customers_and_cities(self, admin_client, buyer, catalog):  # noqa: F811
        from apps.accounts.models import CustomUser

        other = CustomUser.objects.create_user(email="otro@test.com", password="x", first_name="O", last_name="T")
        coupon = Coupon.objects.create(
            code="X10", discount_type="percentage", discount_value=Decimal("10"),
            valid_from="2026-01-01T00:00Z", valid_until="2027-01-01T00:00Z",
        )
        _sale(buyer, catalog["costed"], MONDAY, qty=3, coupon=coupon, shipping_city="Bogota", hour=9)
        _sale(buyer, catalog["costed"], MONDAY, shipping_city=" bogota ", hour=10)
        _sale(other, catalog["uncosted"], MONDAY, shipping_city="Cali")

        data = _get(admin_client).data
        assert data["cupones"]["con"] == {"pedidos": 1, "ticket_promedio": "30000.00", "unidades_promedio": 3.0}
        assert data["cupones"]["sin"] == {"pedidos": 2, "ticket_promedio": "10000.00", "unidades_promedio": 1.0}
        assert data["clientes"] == {"total": 2, "recurrentes": 1, "ingresos_recurrentes": "40000.00"}
        assert data["por_ciudad"][0] == {
            "ciudad": "Bogota", "pedidos": 2, "ingresos": "40000.00", "ticket_promedio": "20000.00",
        }
        assert data["por_ciudad"][1]["ciudad"] == "Cali"

    def test_franchises_dormant_stock_and_coverage(self, admin_client, buyer, catalog):  # noqa: F811
        ShippingZone.objects.create(
            name="Bogota", price=Decimal("8900"), min_days=1, max_days=2, free_shipping_threshold=Decimal("250000"))
        _sale(buyer, catalog["costed"], MONDAY, qty=2)

        data = _get(admin_client).data
        franchises = {f["franquicia"]: f for f in data["por_franquicia"]}
        assert franchises["Naruto"] == {
            "franquicia": "Naruto", "ingresos": "20000.00", "unidades": 2, "productos_activos": 2,
        }
        assert franchises["Marvel"]["ingresos"] == "0.00"

        dormant = {r["nombre"]: r for r in data["inventario_dormido"]}
        assert set(dormant) == {"Pop B", "Pop C"}  # sold out and sold products are left out
        assert dormant["Pop C"]["valor_precio"] == "320000.00"
        assert dormant["Pop C"]["valor_costo"] == "20000.00"
        assert dormant["Pop B"]["valor_costo"] is None

        assert data["cobertura"] == [{
            "product_id": str(catalog["costed"].pk), "nombre": "Pop A", "stock": 10,
            "unidades_por_dia": 0.2, "dias_cobertura": 50,
        }]
        assert data["umbral_envio_gratis"] == "250000.00"
