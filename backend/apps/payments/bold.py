"""Thin client for Bold (bold.co) online payments.

Docs: https://developers.bold.co/pagos-en-linea/boton-de-pagos
      https://developers.bold.co/webhook
"""
import base64
import hashlib
import hmac

import requests
from django.conf import settings

SCRIPT_URL = "https://checkout.bold.co/library/boldPaymentButton.js"


class BoldError(Exception):
    pass


def is_configured():
    return bool(settings.BOLD_API_KEY and settings.BOLD_SECRET_KEY)


def integrity_signature(reference, amount, currency="COP"):
    """SHA256 of {reference}{amount}{currency}{secret}, as Bold requires."""
    raw = f"{reference}{amount}{currency}{settings.BOLD_SECRET_KEY}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def webhook_secret():
    # Bold signs sandbox notifications with an empty key.
    if settings.BOLD_ENVIRONMENT == "sandbox":
        return ""
    return settings.BOLD_SECRET_KEY


def verify_webhook_signature(raw_body, signature):
    """HMAC-SHA256 (hex) of the base64-encoded raw body."""
    if not signature:
        return False
    encoded = base64.b64encode(raw_body)
    expected = hmac.new(
        webhook_secret().encode("utf-8"), encoded, hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature.strip())


def fetch_notifications(reference):
    """All notifications Bold has sent for one of our references."""
    url = f"{settings.BOLD_API_URL}/payments/webhook/notifications/{reference}"
    try:
        response = requests.get(
            url,
            params={"is_external_reference": "true"},
            headers={"Authorization": f"x-api-key {settings.BOLD_API_KEY}"},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise BoldError(f"No se pudo consultar Bold: {exc}") from exc

    if response.status_code == 404:
        return []
    if not response.ok:
        raise BoldError(f"Bold respondio {response.status_code}")
    return response.json().get("notifications", [])
