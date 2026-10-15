import base64
import hashlib
import hmac
import json
import uuid
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from apps.orders.models import Order
from apps.orders.tests.test_checkout_api import (
    _checkout_payload,
    _create_product,
    _create_user,
)
from apps.payments.models import Payment, PaymentEvent

WEBHOOK_URL = "/api/v1/payments/bold/webhook/"


@pytest.fixture(autouse=True)
def bold_settings(settings):
    settings.BOLD_API_KEY = "test-identity-key"
    settings.BOLD_SECRET_KEY = "test-secret-key"
    settings.BOLD_ENVIRONMENT = "production"
    settings.FRONTEND_URL = "https://tienda.test"
    return settings


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _order(user=None, stock=10, quantity=1):
    user = user or _create_user()
    product = _create_product(stock=stock)
    payload = _checkout_payload(product)
    payload["items"][0]["quantity"] = quantity
    resp = _client(user).post("/api/v1/checkout/", payload, format="json")
    assert resp.status_code == 201, resp.data
    return Order.objects.get(pk=resp.data["id"]), product, user


def _init_payment(order, user):
    resp = _client(user).post(f"/api/v1/payments/bold/init/{order.id}/")
    assert resp.status_code == 201, resp.data
    return Payment.objects.get(reference=resp.data["config"]["orderId"]), resp


def _notification(payment, event_type="SALE_APPROVED", total=None, event_id=None):
    return {
        "id": event_id or str(uuid.uuid4()),
        "type": event_type,
        "subject": "PAY123",
        "data": {
            "payment_id": "PAY123",
            "amount": {"currency": "COP", "total": int(total if total is not None else payment.amount)},
            "metadata": {"reference": payment.reference},
            "payment_method": "PSE",
        },
    }


def _sign(body, secret="test-secret-key"):
    return hmac.new(secret.encode(), base64.b64encode(body), hashlib.sha256).hexdigest()


def _post_webhook(notification, signature=None):
    body = json.dumps(notification).encode()
    return APIClient().post(
        WEBHOOK_URL, data=body, content_type="application/json",
        HTTP_X_BOLD_SIGNATURE=signature if signature is not None else _sign(body),
    )


@pytest.mark.django_db
class TestInitPayment:
    def test_returns_signed_bold_config(self):
        order, _, user = _order()
        payment, resp = _init_payment(order, user)
        config = resp.data["config"]

        expected = hashlib.sha256(
            f"{payment.reference}{int(order.total)}COPtest-secret-key".encode()
        ).hexdigest()
        assert config["integritySignature"] == expected
        assert config["amount"] == str(int(order.total))
        assert config["apiKey"] == "test-identity-key"
        assert "test-secret-key" not in json.dumps(resp.data)
        assert config["redirectionUrl"] == f"https://tienda.test/pedido-confirmado/{order.id}"
        assert len(payment.reference) <= 60

    def test_http_frontend_omits_return_urls(self, settings):
        # Bold answers BTN-001 to non-https return URLs (local development).
        settings.FRONTEND_URL = "http://localhost:3000"
        order, _, user = _order()
        _, resp = _init_payment(order, user)
        assert "redirectionUrl" not in resp.data["config"]
        assert "originUrl" not in resp.data["config"]

    def test_each_attempt_gets_a_new_reference(self):
        order, _, user = _order()
        first, _ = _init_payment(order, user)
        second, _ = _init_payment(order, user)
        assert first.reference != second.reference

    def test_not_configured_returns_503(self, settings):
        settings.BOLD_SECRET_KEY = ""
        order, _, user = _order()
        resp = _client(user).post(f"/api/v1/payments/bold/init/{order.id}/")
        assert resp.status_code == 503

    def test_other_users_order_is_404(self):
        order, _, _ = _order()
        intruder = _create_user(email="intruso@test.com")
        resp = _client(intruder).post(f"/api/v1/payments/bold/init/{order.id}/")
        assert resp.status_code == 404

    def test_requires_auth(self):
        order, _, _ = _order()
        resp = APIClient().post(f"/api/v1/payments/bold/init/{order.id}/")
        assert resp.status_code in (401, 403)

    def test_expired_order_is_released(self):
        order, product, user = _order()
        Order.objects.filter(pk=order.pk).update(created_at=timezone.now() - timedelta(hours=2))
        resp = _client(user).post(f"/api/v1/payments/bold/init/{order.id}/")
        assert resp.status_code == 400
        order.refresh_from_db()
        product.refresh_from_db()
        assert order.status == Order.Status.CANCELLED
        assert product.stock == 10


@pytest.mark.django_db
class TestWebhook:
    def test_rejects_invalid_signature(self):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        resp = _post_webhook(_notification(payment), signature="deadbeef")
        assert resp.status_code == 401
        order.refresh_from_db()
        assert order.status == Order.Status.PENDING

    def test_rejects_missing_signature(self):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        resp = _post_webhook(_notification(payment), signature="")
        assert resp.status_code == 401

    def test_sandbox_uses_empty_key(self, settings):
        settings.BOLD_ENVIRONMENT = "sandbox"
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        body = json.dumps(_notification(payment)).encode()
        resp = APIClient().post(
            WEBHOOK_URL, data=body, content_type="application/json",
            HTTP_X_BOLD_SIGNATURE=_sign(body, secret=""),
        )
        assert resp.status_code == 200

    def test_approved_marks_order_paid_and_emails_once(self, django_capture_on_commit_callbacks):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        notification = _notification(payment)

        with django_capture_on_commit_callbacks(execute=True):
            assert _post_webhook(notification).status_code == 200
            assert _post_webhook(notification).status_code == 200  # duplicate delivery

        order.refresh_from_db()
        payment.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert order.paid_at is not None
        assert payment.status == Payment.Status.APPROVED
        assert payment.payment_method == "PSE"
        assert PaymentEvent.objects.count() == 1
        assert len(mail.outbox) == 1

    def test_amount_mismatch_is_not_marked_paid(self):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        _post_webhook(_notification(payment, total=1000))
        order.refresh_from_db()
        assert order.status == Order.Status.PENDING
        assert order.requires_attention

    def test_rejected_keeps_order_pending_for_retry(self):
        order, product, user = _order()
        payment, _ = _init_payment(order, user)
        _post_webhook(_notification(payment, "SALE_REJECTED"))
        order.refresh_from_db()
        payment.refresh_from_db()
        product.refresh_from_db()
        assert payment.status == Payment.Status.REJECTED
        assert order.status == Order.Status.PENDING
        assert product.stock == 9

    def test_rejected_after_approved_does_not_cancel(self):
        order, product, user = _order()
        payment, _ = _init_payment(order, user)
        _post_webhook(_notification(payment))
        _post_webhook(_notification(payment, "SALE_REJECTED"))
        order.refresh_from_db()
        product.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert product.stock == 9

    def test_unknown_reference_is_ignored(self):
        resp = _post_webhook({
            "id": str(uuid.uuid4()), "type": "SALE_APPROVED",
            "data": {"amount": {"total": 5000}, "metadata": {"reference": "NO-EXISTE"}},
        })
        assert resp.status_code == 200

    def test_approved_after_expiry_with_stock_reserves_again(self):
        order, product, user = _order(stock=5)
        payment, _ = _init_payment(order, user)
        Order.objects.filter(pk=order.pk).update(created_at=timezone.now() - timedelta(hours=3))
        from apps.orders.services import release_order
        release_order(order)
        product.refresh_from_db()
        assert product.stock == 5

        _post_webhook(_notification(payment))

        order.refresh_from_db()
        product.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert order.requires_attention
        assert product.stock == 4

    def test_approved_after_expiry_without_stock_flags_order(self):
        order, product, user = _order(stock=1)
        payment, _ = _init_payment(order, user)
        from apps.orders.services import release_order
        release_order(order)
        product.stock = 0
        product.save()

        _post_webhook(_notification(payment))

        order.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert order.requires_attention
        assert "sin stock" in order.attention_reason

    def test_second_approved_payment_is_flagged_as_duplicate(self):
        order, _, user = _order()
        first, _ = _init_payment(order, user)
        second, _ = _init_payment(order, user)
        _post_webhook(_notification(first))
        _post_webhook(_notification(second))
        order.refresh_from_db()
        assert order.status == Order.Status.PAID
        assert "duplicado" in order.attention_reason

    def test_void_marks_refunded(self):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)
        _post_webhook(_notification(payment))
        _post_webhook(_notification(payment, "VOID_APPROVED"))
        order.refresh_from_db()
        assert order.status == Order.Status.REFUNDED
        assert order.requires_attention


@pytest.mark.django_db
class TestSync:
    def test_sync_applies_missed_notifications(self):
        order, _, user = _order()
        payment, _ = _init_payment(order, user)

        with patch("apps.payments.bold.fetch_notifications", return_value=[_notification(payment)]) as fetch:
            resp = _client(user).post(f"/api/v1/payments/orders/{order.id}/sync/")

        fetch.assert_called_once_with(payment.reference)
        assert resp.status_code == 200
        assert resp.data["status"] == "paid"

    def test_sync_survives_bold_errors(self):
        from apps.payments.bold import BoldError

        order, _, user = _order()
        _init_payment(order, user)
        with patch("apps.payments.bold.fetch_notifications", side_effect=BoldError("down")):
            resp = _client(user).post(f"/api/v1/payments/orders/{order.id}/sync/")
        assert resp.status_code == 200
        assert resp.data["status"] == "pending"

    def test_sync_other_users_order_is_404(self):
        order, _, _ = _order()
        intruder = _create_user(email="intruso@test.com")
        resp = _client(intruder).post(f"/api/v1/payments/orders/{order.id}/sync/")
        assert resp.status_code == 404
