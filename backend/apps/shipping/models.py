import uuid
from decimal import Decimal

from django.db import models


class ShippingZone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_days = models.PositiveIntegerField()
    max_days = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    free_shipping_threshold = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
    )

    class Meta:
        ordering = ["price"]

    def __str__(self):
        return self.name
