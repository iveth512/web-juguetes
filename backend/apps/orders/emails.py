import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db import connection
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send(subject, template, context, recipient):
    try:
        send_mail(
            subject=subject,
            message=render_to_string(f"emails/{template}.txt", context),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=render_to_string(f"emails/{template}.html", context),
        )
    except Exception:
        logger.exception("Could not send '%s' email to %s", template, recipient)


def _dispatch(subject, template, context, recipient):
    """Send in a background thread so slow SMTP never delays a request
    (Bold's webhook must answer within 2 seconds)."""
    if not settings.SEND_EMAILS_ASYNC:
        _send(subject, template, context, recipient)
        return

    def run():
        try:
            _send(subject, template, context, recipient)
        finally:
            connection.close()

    threading.Thread(target=run, daemon=True).start()


def send_order_confirmation_email(order):
    """Send order confirmation email to customer."""
    context = {
        'order': order,
        'items': list(order.items.select_related('product').all()),
        'order_id_short': order.short_id,
    }
    _dispatch(
        f"Juguetes para Frikis — Pedido #{order.short_id} confirmado",
        "order_confirmation", context, order.user.email,
    )


def send_order_shipped_email(order):
    """Send shipping notification email."""
    context = {
        'order': order,
        'order_id_short': order.short_id,
    }
    _dispatch(
        f"Juguetes para Frikis — Tu pedido #{order.short_id} fue enviado",
        "order_shipped", context, order.user.email,
    )
