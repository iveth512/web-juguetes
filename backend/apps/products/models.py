import uuid
from decimal import Decimal

from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="children",
    )
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


class Franchise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    logo = models.ImageField(upload_to="franchises/", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        while Franchise.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        while Brand.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=300, blank=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products",
    )
    franchise = models.ForeignKey(
        Franchise, on_delete=models.PROTECT, related_name="products",
    )
    brand = models.ForeignKey(
        Brand, on_delete=models.PROTECT, related_name="products",
    )

    sku = models.CharField(max_length=50, unique=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )

    has_variants = models.BooleanField(default=False)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_on_sale = models.BooleanField(default=False)
    sale_percentage = models.PositiveIntegerField(null=True, blank=True)

    weight_grams = models.PositiveIntegerField(null=True, blank=True)
    dimensions = models.CharField(max_length=50, blank=True)

    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    tags = models.JSONField(default=list, blank=True)

    # Internal cost fields (admin only)
    cost_usd = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    import_lot = models.ForeignKey(
        "imports.ImportLot", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products",
    )
    import_cost_per_unit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    total_cost_cop = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    profit_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
    )
    suggested_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    local_shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    gross_margin = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    margin_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, editable=False,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        self._calculate_costs()
        self._sync_variant_stock()
        previous_lot_id = (
            Product.objects.filter(pk=self.pk).values_list("import_lot_id", flat=True).first()
            if not self._state.adding else None
        )
        super().save(*args, **kwargs)
        if previous_lot_id != self.import_lot_id:
            # Lot product counts / per-unit costs depend on membership.
            from apps.imports.models import ImportLot

            for lot in ImportLot.objects.filter(pk__in=[previous_lot_id, self.import_lot_id]):
                lot.recalculate()

    def _generate_unique_slug(self):
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def _calculate_costs(self):
        """Compute cost fields from import_lot data."""
        if not self.import_lot:
            return

        lot = self.import_lot

        # import_cost_per_unit from the lot's cost_per_unit
        if lot.cost_per_unit is not None:
            self.import_cost_per_unit = lot.cost_per_unit

        # total_cost_cop = (cost_usd * exchange_rate) + import_cost_per_unit
        if self.cost_usd is not None and lot.exchange_rate:
            product_cost_cop = self.cost_usd * lot.exchange_rate
            import_share = self.import_cost_per_unit or Decimal("0")
            self.total_cost_cop = product_cost_cop + import_share

            # Add local shipping cost if present
            local_ship = self.local_shipping_cost or Decimal("0")
            total_with_shipping = self.total_cost_cop + local_ship

            # suggested_price using margin
            margin_pct = self.profit_margin_pct or lot.default_margin_pct
            if margin_pct is not None:
                multiplier = Decimal("1") + (margin_pct / Decimal("100"))
                self.suggested_price = (total_with_shipping * multiplier).quantize(
                    Decimal("0.01")
                )

            # gross_margin = base_price - total_cost_cop
            if self.base_price:
                self.gross_margin = self.base_price - total_with_shipping

                # margin_percentage
                if self.base_price > 0:
                    self.margin_percentage = (
                        (self.gross_margin / self.base_price) * Decimal("100")
                    ).quantize(Decimal("0.01"))

    def _sync_variant_stock(self):
        """If has_variants and saved before, sync stock to sum of variant stocks."""
        if self.has_variants and self.pk:
            try:
                variant_stock = (
                    self.variants.aggregate(total=models.Sum("stock"))["total"] or 0
                )
                self.stock = variant_stock
            except Exception:
                pass


class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants",
    )
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    cost_usd = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    exchange_rate = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    import_cost_cop = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.product.save()


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images",
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.product.name} - Image {self.display_order}"
