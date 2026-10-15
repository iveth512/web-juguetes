from decimal import Decimal
from datetime import date

import pytest

from apps.imports.models import ImportLot


@pytest.mark.django_db
class TestImportLot:
    def test_total_cost_calculation(self):
        lot = ImportLot.objects.create(
            name="Lote Test",
            date=date(2025, 3, 1),
            exchange_rate=Decimal("4200.00"),
            shipping_cost_usd=Decimal("150.00"),
            customs_cost_cop=Decimal("300000.00"),
            other_costs_cop=Decimal("50000.00"),
        )
        # total_cost = (150 * 4200) + 300000 + 50000 = 630000 + 300000 + 50000 = 980000
        lot.refresh_from_db()
        assert lot.total_cost == Decimal("980000.00")
        assert lot.product_count == 0
        assert lot.cost_per_unit is None

    def test_total_cost_without_other_costs(self):
        lot = ImportLot.objects.create(
            name="Lote Simple",
            date=date(2025, 3, 1),
            exchange_rate=Decimal("4000.00"),
            shipping_cost_usd=Decimal("100.00"),
            customs_cost_cop=Decimal("200000.00"),
        )
        # total_cost = (100 * 4000) + 200000 + 0 = 600000
        lot.refresh_from_db()
        assert lot.total_cost == Decimal("600000.00")

    def test_str(self):
        lot = ImportLot.objects.create(
            name="Lote Enero",
            date=date(2025, 1, 15),
            exchange_rate=Decimal("4000.00"),
            shipping_cost_usd=Decimal("100.00"),
            customs_cost_cop=Decimal("200000.00"),
        )
        assert str(lot) == "Lote Enero"
