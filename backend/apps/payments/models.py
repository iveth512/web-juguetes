import uuid

from django.db import models


class Payment(models.Model):
    """One payment attempt for an order. Each attempt has its own reference,
    because Bold rejects a reused order id."""

    class Provider(models.TextChoices):
        BOLD = "bold", "Bold"
        SIMULATED = "simulado", "Pasarela simulada (solo local)"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        APPROVED = "approved", "Aprobado"
        REJECTED = "rejected", "Rechazado"
        VOIDED = "voided", "Anulado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        "orders.Order", on_delete=models.PROTECT, related_name="payments",
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    reference = models.CharField(max_length=60, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    currency = models.CharField(max_length=3, default="COP")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING,
    )
    provider_payment_id = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "pago"
        verbose_name_plural = "pagos"

    def __str__(self):
        return f"{self.reference} ({self.get_status_display()})"


class PaymentEvent(models.Model):
    """Raw provider notification, stored once per event id (idempotency + audit)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=20, choices=Payment.Provider.choices)
    event_id = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=50)
    payment = models.ForeignKey(
        Payment, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="events",
    )
    payload = models.JSONField()
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_at"]
        verbose_name = "evento de pago"
        verbose_name_plural = "eventos de pago"

    def __str__(self):
        return f"{self.event_type} {self.event_id}"
