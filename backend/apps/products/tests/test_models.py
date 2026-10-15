from decimal import Decimal
from datetime import date

import pytest

from apps.products.models import (
    Category,
    Franchise,
    Brand,
    Product,
    ProductVariant,
)
from apps.imports.models import ImportLot


@pytest.mark.django_db
class TestCategory:
    def test_create_category(self):
        cat = Category.objects.create(name="Figuras de Accion")
        assert cat.name == "Figuras de Accion"
        assert cat.is_active is True
        assert str(cat) == "Figuras de Accion"

    def test_slug_auto_generation(self):
        cat = Category.objects.create(name="Figuras de Accion")
        assert cat.slug == "figuras-de-accion"

    def test_slug_uniqueness(self):
        cat1 = Category.objects.create(name="Figuras de Accion")
        cat2 = Category.objects.create(name="Figuras de Accion")
        assert cat1.slug != cat2.slug
        assert cat2.slug == "figuras-de-accion-1"

    def test_subcategory_parent(self):
        parent = Category.objects.create(name="Anime")
        child = Category.objects.create(name="Dragon Ball", parent=parent)
        assert child.parent == parent
        assert parent.children.count() == 1
        assert parent.children.first() == child


@pytest.mark.django_db
class TestFranchise:
    def test_create_franchise(self):
        fr = Franchise.objects.create(name="Dragon Ball Z")
        assert fr.name == "Dragon Ball Z"
        assert str(fr) == "Dragon Ball Z"

    def test_slug_auto_generation(self):
        fr = Franchise.objects.create(name="Dragon Ball Z")
        assert fr.slug == "dragon-ball-z"


@pytest.mark.django_db
class TestBrand:
    def test_create_brand(self):
        brand = Brand.objects.create(name="Bandai")
        assert brand.name == "Bandai"
        assert str(brand) == "Bandai"

    def test_slug_auto_generation(self):
        brand = Brand.objects.create(name="Bandai Namco")
        assert brand.slug == "bandai-namco"


@pytest.mark.django_db
class TestProduct:
    @pytest.fixture
    def product_deps(self):
        category = Category.objects.create(name="Figuras")
        franchise = Franchise.objects.create(name="Dragon Ball Z")
        brand = Brand.objects.create(name="Bandai")
        return category, franchise, brand

    def test_create_product(self, product_deps):
        category, franchise, brand = product_deps
        product = Product.objects.create(
            name="Goku Ultra Instinct",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="DBZ-GOKU-UI-001",
            base_price=Decimal("150000.00"),
        )
        assert product.name == "Goku Ultra Instinct"
        assert product.is_active is True
        assert product.stock == 0
        assert str(product) == "Goku Ultra Instinct"

    def test_slug_auto_generation(self, product_deps):
        category, franchise, brand = product_deps
        product = Product.objects.create(
            name="Goku Ultra Instinct",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="DBZ-GOKU-UI-001",
            base_price=Decimal("150000.00"),
        )
        assert product.slug == "goku-ultra-instinct"

    def test_slug_uniqueness(self, product_deps):
        category, franchise, brand = product_deps
        p1 = Product.objects.create(
            name="Goku Ultra Instinct",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="DBZ-GOKU-UI-001",
            base_price=Decimal("150000.00"),
        )
        p2 = Product.objects.create(
            name="Goku Ultra Instinct",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="DBZ-GOKU-UI-002",
            base_price=Decimal("160000.00"),
        )
        assert p1.slug != p2.slug
        assert p2.slug == "goku-ultra-instinct-1"

    def test_cost_calculations_with_import_lot(self, product_deps):
        category, franchise, brand = product_deps

        lot = ImportLot.objects.create(
            name="Lote Enero 2025",
            date=date(2025, 1, 15),
            exchange_rate=Decimal("4000.00"),
            shipping_cost_usd=Decimal("100.00"),
            customs_cost_cop=Decimal("200000.00"),
            other_costs_cop=Decimal("50000.00"),
        )
        # total_cost = (100 * 4000) + 200000 + 50000 = 650000
        lot.refresh_from_db()
        assert lot.total_cost == Decimal("650000.00")

        product = Product.objects.create(
            name="Vegeta SSGSS",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="DBZ-VEG-001",
            base_price=Decimal("200000.00"),
            cost_usd=Decimal("15.00"),
            import_lot=lot,
        )

        # Refresh lot to get updated product_count after product was created
        lot.refresh_from_db()
        assert lot.product_count == 1
        assert lot.cost_per_unit == Decimal("650000.00")

        # Re-save product so it picks up the lot's updated cost_per_unit
        product.save()
        product.refresh_from_db()

        # import_cost_per_unit should be lot.cost_per_unit
        assert product.import_cost_per_unit == Decimal("650000.00")

        # total_cost_cop = cost_usd * exchange_rate + import_cost_per_unit
        # = 15 * 4000 + 650000 = 710000
        assert product.total_cost_cop == Decimal("710000.00")

        # suggested_price with default 40% margin on (total_cost_cop + local_shipping)
        # = 710000 * 1.40 = 994000
        assert product.suggested_price == Decimal("994000.00")

        # gross_margin = base_price - total_cost_cop = 200000 - 710000 = -510000
        assert product.gross_margin == Decimal("-510000.00")


@pytest.mark.django_db
class TestProductVariant:
    def test_create_variant(self):
        category = Category.objects.create(name="Figuras")
        franchise = Franchise.objects.create(name="Naruto")
        brand = Brand.objects.create(name="Banpresto")
        product = Product.objects.create(
            name="Naruto Sage Mode",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="NAR-SAGE-001",
            base_price=Decimal("120000.00"),
            has_variants=True,
        )
        variant = ProductVariant.objects.create(
            product=product,
            name="20cm",
            sku="NAR-SAGE-001-20",
            price=Decimal("120000.00"),
            stock=10,
        )
        assert variant.name == "20cm"
        assert str(variant) == "Naruto Sage Mode - 20cm"

    def test_variant_stock_sync(self):
        category = Category.objects.create(name="Figuras")
        franchise = Franchise.objects.create(name="Naruto")
        brand = Brand.objects.create(name="Banpresto")
        product = Product.objects.create(
            name="Naruto Sage Mode",
            category=category,
            franchise=franchise,
            brand=brand,
            sku="NAR-SAGE-001",
            base_price=Decimal("120000.00"),
            has_variants=True,
        )

        ProductVariant.objects.create(
            product=product,
            name="20cm",
            sku="NAR-SAGE-001-20",
            price=Decimal("120000.00"),
            stock=10,
        )
        ProductVariant.objects.create(
            product=product,
            name="30cm",
            sku="NAR-SAGE-001-30",
            price=Decimal("150000.00"),
            stock=5,
        )

        product.refresh_from_db()
        assert product.stock == 15
