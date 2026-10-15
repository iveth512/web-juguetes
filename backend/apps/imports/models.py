import uuid
from decimal import Decimal

from django.db import models


class ImportLot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    date = models.DateField()
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost_usd = models.DecimalField(max_digits=10, decimal_places=2)
    customs_cost_cop = models.DecimalField(max_digits=12, decimal_places=2)
    other_costs_cop = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0"),
    )
    total_cost = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    product_count = models.PositiveIntegerField(default=0, editable=False)
    cost_per_unit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, editable=False,
    )
    default_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("40.00"),
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Calculate total_cost
        shipping_cop = self.shipping_cost_usd * self.exchange_rate
        self.total_cost = shipping_cop + self.customs_cost_cop + self.other_costs_cop
        super().save(*args, **kwargs)
        self.recalculate()

    def recalculate(self):
        """Recalculate product_count and cost_per_unit without triggering save()."""
        count = self.products.count()
        cost_per_unit = None
        if count > 0 and self.total_cost:
            cost_per_unit = (self.total_cost / Decimal(str(count))).quantize(
                Decimal("0.01")
            )
        ImportLot.objects.filter(pk=self.pk).update(
            product_count=count,
            cost_per_unit=cost_per_unit,
        )
        # Update instance attributes to reflect DB state
        self.product_count = count
        self.cost_per_unit = cost_per_unit
