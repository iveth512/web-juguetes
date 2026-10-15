import uuid
from decimal import Decimal

from django.db import models
from django.utils import timezone


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        PAID = "paid", "Pagado"
        SHIPPED = "shipped", "Enviado"
        DELIVERED = "delivered", "Entregado"
        CANCELLED = "cancelled", "Cancelado"
        REFUNDED = "refunded", "Reembolsado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    total = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    coupon = models.ForeignKey(
        "Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    shipping_name = models.CharField(max_length=200, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)
    shipping_address = models.CharField(max_length=200, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_department = models.CharField(max_length=100, blank=True)

    notes = models.TextField(blank=True)

    shipping_carrier = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)

    # Set when an order needs a human, e.g. a payment approved for an
    # order whose stock had already been released.
    requires_attention = models.BooleanField(default=False)
    attention_reason = models.TextField(blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pedido {self.short_id} \u2014 {self.user.email}"

    @property
    def short_id(self):
        return str(self.id)[:8]

    def flag_attention(self, reason):
        self.requires_attention = True
        self.attention_reason = (
            f"{self.attention_reason}\n{reason}".strip()
        )


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="order_items",
    )
    variant_name = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        if self.variant_name:
            return f"{self.product} ({self.variant_name}) x{self.quantity}"
        return f"{self.product} x{self.quantity}"


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Porcentaje"
        FIXED = "fixed", "Fijo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True)
    discount_type = models.CharField(
        max_length=10,
        choices=DiscountType.choices,
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_purchase = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0"),
    )
    max_uses = models.PositiveIntegerField(
        default=0, help_text="0 = ilimitado",
    )
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    class Meta:
        ordering = ["-valid_from"]

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def is_valid(self, subtotal=0):
        """Return (bool, str) indicating if the coupon is valid."""
        if not self.is_active:
            return False, "El cup\u00f3n no est\u00e1 activo."

        now = timezone.now()
        if now > self.valid_until:
            return False, "El cup\u00f3n ha expirado."
        if now < self.valid_from:
            return False, "El cup\u00f3n a\u00fan no es v\u00e1lido."

        if self.max_uses > 0 and self.times_used >= self.max_uses:
            return False, "El cup\u00f3n se ha agotado."

        if subtotal < self.min_purchase:
            return False, (
                f"El pedido no alcanza el m\u00ednimo de ${self.min_purchase:,.0f}."
            )

        return True, "Cup\u00f3n v\u00e1lido."

    def calculate_discount(self, subtotal):
        """Calculate the discount amount for the given subtotal."""
        subtotal = Decimal(str(subtotal))
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return subtotal * self.discount_value / Decimal("100")
        # fixed
        return min(self.discount_value, subtotal)
