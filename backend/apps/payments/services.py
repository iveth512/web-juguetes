import logging
import secrets
import time
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError, transaction

from apps.orders.emails import send_order_confirmation_email
from apps.orders.models import Order
from apps.orders.services import mark_order_paid

from . import bold
from .models import Payment, PaymentEvent

logger = logging.getLogger(__name__)


def new_reference(order):
    # Bold: alphanumeric, '-' and '_', max 60 chars, unique per attempt.
    return f"JPF-{order.short_id}-{int(time.time())}-{secrets.token_hex(3)}"


def start_payment(order, provider):
    return Payment.objects.create(
        order=order,
        provider=provider,
        reference=new_reference(order),
        amount=order.total.quantize(Decimal("1")),
        currency="COP",
    )


def start_bold_payment(order):
    return start_payment(order, Payment.Provider.BOLD)


def _amount_total(data):
    try:
        return Decimal(str(data.get("amount", {}).get("total")))
    except (InvalidOperation, TypeError):
        return None


def apply_bold_notification(notification):
    return apply_notification(notification, Payment.Provider.BOLD)


def apply_notification(notification, provider):
    """Apply one payment notification (Bold's format). Safe to call repeatedly
    with the same event.

    Returns the affected Payment, or None if the event was a duplicate or
    does not belong to us.
    """
    event_id = str(notification.get("id") or "")
    event_type = notification.get("type", "")
    data = notification.get("data") or {}
    reference = (data.get("metadata") or {}).get("reference", "")

    if not event_id or not event_type:
        logger.warning("Payment notification without id/type ignored")
        return None

    with transaction.atomic():
        payment = (
            Payment.objects.select_for_update()
            .select_related("order")
            .filter(provider=provider, reference=reference)
            .first()
        )
        try:
            with transaction.atomic():
                PaymentEvent.objects.create(
                    provider=provider,
                    event_id=event_id,
                    event_type=event_type,
                    payment=payment,
                    payload=notification,
                )
        except IntegrityError:
            return None  # already processed

        if payment is None:
            logger.warning("Payment event %s for unknown reference %r", event_id, reference)
            return None

        payment.provider_payment_id = data.get("payment_id", "") or payment.provider_payment_id
        payment.payment_method = data.get("payment_method", "") or payment.payment_method

        if event_type == "SALE_APPROVED":
            _on_approved(payment, _amount_total(data))
        elif event_type == "SALE_REJECTED":
            # The order stays pending so the customer can retry until it expires.
            if payment.status == Payment.Status.PENDING:
                payment.status = Payment.Status.REJECTED
        elif event_type == "VOID_APPROVED":
            _on_voided(payment)
        payment.save()
    return payment


def _on_approved(payment, paid_total):
    if payment.status == Payment.Status.APPROVED:
        return
    payment.status = Payment.Status.APPROVED
    order = payment.order

    if paid_total is None or paid_total != payment.amount:
        order.flag_attention(
            f"Pago {payment.reference} aprobado por {paid_total} pero se esperaba "
            f"{payment.amount}. Revisar antes de despachar."
        )
        order.save(update_fields=["requires_attention", "attention_reason", "updated_at"])
        return

    already_paid = order.payments.filter(status=Payment.Status.APPROVED).exclude(pk=payment.pk).exists()
    if already_paid:
        order.flag_attention(
            f"Pago duplicado: {payment.reference} aprobado para un pedido ya pagado. Reembolsar."
        )
        order.save(update_fields=["requires_attention", "attention_reason", "updated_at"])
        return

    if mark_order_paid(order):
        transaction.on_commit(lambda: send_order_confirmation_email(Order.objects.get(pk=order.pk)))


def _on_voided(payment):
    payment.status = Payment.Status.VOIDED
    order = Order.objects.select_for_update().get(pk=payment.order_id)
    if order.status == Order.Status.PAID:
        order.status = Order.Status.REFUNDED
    order.flag_attention(f"Bold anulo el pago {payment.reference}.")
    order.save()


def reconcile_payment(payment):
    """Ask Bold for the notifications of a payment and apply any we missed."""
    try:
        notifications = bold.fetch_notifications(payment.reference)
    except bold.BoldError as exc:
        logger.warning("Bold reconcile failed for %s: %s", payment.reference, exc)
        return False
    for notification in sorted(notifications, key=lambda n: n.get("time") or 0):
        apply_bold_notification(notification)
    return True


def resolve_simulated_payment(payment, approved):
    """Local-only gateway: produce the notification a real gateway would send
    and run it through the same processing as Bold's webhook."""
    notification = {
        "id": f"SIM-{secrets.token_hex(8)}",
        "type": "SALE_APPROVED" if approved else "SALE_REJECTED",
        "data": {
            "payment_id": f"SIM-{payment.reference}",
            "payment_method": "CARD",
            "amount": {"currency": payment.currency, "total": int(payment.amount)},
            "metadata": {"reference": payment.reference},
        },
    }
    return apply_notification(notification, Payment.Provider.SIMULATED)
