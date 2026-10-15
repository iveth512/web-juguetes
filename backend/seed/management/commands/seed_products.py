"""
Management command to seed the database with realistic product data
for JuguetesParaFrikis — a Colombian collectibles e-commerce.
"""
import datetime
from pathlib import Path
from datetime import timedelta
from decimal import Decimal

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.products.models import (
    Category,
    Franchise,
    Brand,
    Product,
    ProductImage,
)
from apps.imports.models import ImportLot
from apps.shipping.models import ShippingZone
from seed.catalog import PRODUCTS, product_fields

IMAGES_DIR = Path(__file__).resolve().parents[2] / "images"
CATALOG_AGE_DAYS = 120


class Command(BaseCommand):
    help = "Seeds the database with categories, franchises, brands, import lots, shipping zones, and the Funko Pop! catalog."

    def handle(self, *args, **options):
        categories = self._seed_categories()
        franchises = self._seed_franchises()
        brands = self._seed_brands()
        lots = self._seed_import_lots()
        zones = self._seed_shipping_zones()
        products_created = self._seed_products(categories, franchises, brands, lots)

        self.stdout.write(self.style.SUCCESS(
            f"Created {len(categories)} categories, "
            f"{len(franchises)} franchises, "
            f"{len(brands)} brands, "
            f"{len(lots)} import lots, "
            f"{len(zones)} shipping zones, "
            f"{products_created} products"
        ))

        # Seed coupons
        from apps.orders.models import Coupon

        coupons_data = [
            {
                "code": "BIENVENIDO10",
                "discount_type": "percentage",
                "discount_value": Decimal("10"),
                "min_purchase": Decimal("50000"),
                "valid_from": timezone.now(),
                "valid_until": timezone.now() + timedelta(days=365),
            },
            {
                "code": "ENVIOGRATIS",
                "discount_type": "fixed",
                "discount_value": Decimal("15000"),
                "min_purchase": Decimal("200000"),
                "valid_from": timezone.now(),
                "valid_until": timezone.now() + timedelta(days=365),
            },
            {
                "code": "FRIKI20",
                "discount_type": "percentage",
                "discount_value": Decimal("20"),
                "min_purchase": Decimal("100000"),
                "max_uses": 50,
                "valid_from": timezone.now(),
                "valid_until": timezone.now() + timedelta(days=90),
            },
        ]

        coupon_count = 0
        for cdata in coupons_data:
            _, created = Coupon.objects.get_or_create(code=cdata["code"], defaults=cdata)
            if created:
                coupon_count += 1

        self.stdout.write(self.style.SUCCESS(f"Cupones creados: {coupon_count}"))

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------
    # ------------------------------------------------------------------
    # Taxonomy: the store only sells Funko Pop! for now
    # ------------------------------------------------------------------
    def _seed_categories(self):
        obj, _ = Category.objects.get_or_create(name="Funko Pop!", defaults={"display_order": 1})
        return {"Funko Pop!": obj}

    def _seed_franchises(self):
        frs = {}
        for name in dict.fromkeys(row[2] for row in PRODUCTS):
            frs[name], _ = Franchise.objects.get_or_create(name=name)
        return frs

    def _seed_brands(self):
        obj, _ = Brand.objects.get_or_create(name="Funko")
        return {"Funko": obj}


    # ------------------------------------------------------------------
    # Import Lots
    # ------------------------------------------------------------------
    def _seed_import_lots(self):
        data = [
            {
                "name": "Lote Enero 2026",
                "date": datetime.date(2026, 1, 15),
                "exchange_rate": Decimal("4150.00"),
                "shipping_cost_usd": Decimal("120.00"),
                "customs_cost_cop": Decimal("280000.00"),
                "other_costs_cop": Decimal("50000.00"),
                "default_margin_pct": Decimal("40.00"),
            },
            {
                "name": "Lote Marzo 2026",
                "date": datetime.date(2026, 3, 1),
                "exchange_rate": Decimal("4220.00"),
                "shipping_cost_usd": Decimal("95.00"),
                "customs_cost_cop": Decimal("220000.00"),
                "other_costs_cop": Decimal("35000.00"),
                "default_margin_pct": Decimal("45.00"),
            },
        ]
        lots = {}
        for d in data:
            obj, _ = ImportLot.objects.get_or_create(
                name=d["name"],
                defaults={k: v for k, v in d.items() if k != "name"},
            )
            lots[d["name"]] = obj
        return lots

    # ------------------------------------------------------------------
    # Shipping Zones
    # ------------------------------------------------------------------
    def _seed_shipping_zones(self):
        data = [
            ("Bogota", Decimal("8900"), 1, 2, Decimal("250000")),
            ("Medellin", Decimal("12900"), 2, 3, Decimal("250000")),
            ("Cali", Decimal("12900"), 2, 3, Decimal("250000")),
            ("Resto del pais", Decimal("18900"), 3, 5, Decimal("250000")),
        ]
        zones = []
        for name, price, min_d, max_d, threshold in data:
            obj, _ = ShippingZone.objects.get_or_create(
                name=name,
                defaults={
                    "price": price,
                    "min_days": min_d,
                    "max_days": max_d,
                    "free_shipping_threshold": threshold,
                },
            )
            zones.append(obj)
        return zones

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------
    def _seed_products(self, cats, frs, brands, lots):
        lot_names = list(lots)
        created_count = 0
        for i, (sku, name, franchise, price, stock, opts) in enumerate(PRODUCTS):
            fields = product_fields(sku, name, franchise, price, stock, opts)
            fields.update(
                category=cats["Funko Pop!"],
                franchise=frs[franchise],
                brand=brands["Funko"],
                import_lot=lots[lot_names[i % len(lot_names)]],
            )
            product, created = Product.objects.get_or_create(sku=sku, defaults=fields)
            if created:  # listed before the 90 days of demo sales
                Product.objects.filter(pk=product.pk).update(created_at=timezone.now() - timedelta(days=CATALOG_AGE_DAYS))
            created_count += created
            self._attach_photos(product)
        # Each save changes its lot's per-unit import cost; refresh every product's landed cost.
        for product in Product.objects.filter(import_lot__isnull=False).select_related("import_lot"):
            product.save()
        return created_count

    def _attach_photos(self, product):
        if product.images.exists():
            return
        photos = sorted(IMAGES_DIR.glob(f"{product.sku}-*.webp"), key=lambda p: int(p.stem.rsplit("-", 1)[1]))
        for order, path in enumerate(photos):
            image = ProductImage(product=product, is_primary=order == 0, display_order=order, alt_text=product.name)
            with path.open("rb") as fh:
                image.image.save(f"{product.slug}-{order + 1}.webp", File(fh), save=True)
