from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.models import Order
from apps.orders.tests.test_checkout_api import _checkout_payload, _create_product, _create_user
from apps.payments.models import Payment


@pytest.fixture
def simulated(settings):
    settings.DEBUG = True
    settings.PAYMENTS_PROVIDER = "simulado"
    return settings


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _order(user, stock=10):
    product = _create_product(stock=stock)
    resp = _client(user).post("/api/v1/checkout/", _checkout_payload(product), format="json")
    assert resp.status_code == 201, resp.data
    return Order.objects.get(pk=resp.data["id"]), product


def _start(user, order):
    resp = _client(user).post(f"/api/v1/payments/init/{order.id}/")
    assert resp.status_code == 201, resp.data
    return resp.data


@pytest.mark.django_db
class TestSimulatedGateway:
    def test_init_returns_local_checkout_page(self, simulated):
        user = _create_user()
        order, _ = _order(user)
        data = _start(user, order)
        assert data["provider"] == "simulado"
        reference = data["checkout_url"].rsplit("/", 1)[-1]
        payment = Payment.objects.get(reference=reference)
        assert payment.provider == Payment.Provider.SIMULATED
        assert payment.amount == order.total

    def test_shows_charge_to_owner_only(self, simulated):
        user = _create_user()
        order, _ = _order(user)
        reference = _start(user, order)["checkout_url"].rsplit("/", 1)[-1]

        resp = _client(user).get(f"/api/v1/payments/simulado/{reference}/")
        assert resp.status_code == 200
        assert resp.data["amount"] == str(int(order.total))
        intruder = _create_user(email="otro@test.com")
        assert _client(intruder).get(f"/api/v1/payments/simulado/{reference}/").status_code == 404

    def test_approve_marks_order_paid(self, simulated, django_capture_on_commit_callbacks):
        user = _create_user()
        order, product = _order(user)
        reference = _start(user, order)["checkout_url"].rsplit("/", 1)[-1]

        with django_capture_on_commit_callbacks(execute=True):
            resp = _client(user).post(f"/api/v1/payments/simulado/{reference}/", {"resultado": "aprobado"}, format="json")

        assert resp.status_code == 200
        assert resp.data["order_status"] == "paid"
        order.refresh_from_db()
        product.refresh_from_db()
        assert order.paid_at is not None
        assert product.stock == 9

    def test_reject_keeps_order_pending_and_allows_retry(self, simulated):
        user = _create_user()
        order, _ = _order(user)
        reference = _start(user, order)["checkout_url"].rsplit("/", 1)[-1]

        resp = _client(user).post(f"/api/v1/payments/simulado/{reference}/", {"resultado": "rechazado"}, format="json")
        assert resp.data["payment_status"] == "rejected"
        assert resp.data["order_status"] == "pending"
        # Same payment cannot be resolved twice; a new attempt can.
        again = _client(user).post(f"/api/v1/payments/simulado/{reference}/", {"resultado": "aprobado"}, format="json")
        assert again.status_code == 400
        retry = _start(user, order)["checkout_url"].rsplit("/", 1)[-1]
        ok = _client(user).post(f"/api/v1/payments/simulado/{retry}/", {"resultado": "aprobado"}, format="json")
        assert ok.data["order_status"] == "paid"

    def test_invalid_result(self, simulated):
        user = _create_user()
        order, _ = _order(user)
        reference = _start(user, order)["checkout_url"].rsplit("/", 1)[-1]
        resp = _client(user).post(f"/api/v1/payments/simulado/{reference}/", {"resultado": "quizas"}, format="json")
        assert resp.status_code == 400

    def test_disabled_without_debug(self, settings):
        settings.DEBUG = False
        settings.PAYMENTS_PROVIDER = "simulado"
        user = _create_user()
        order, _ = _order(user)
        # Falls back to Bold, which is not configured here.
        resp = _client(user).post(f"/api/v1/payments/init/{order.id}/")
        assert resp.status_code == 503
        assert not Payment.objects.filter(provider=Payment.Provider.SIMULATED).exists()

    def test_generic_init_uses_bold_when_configured(self, settings):
        settings.PAYMENTS_PROVIDER = "bold"
        settings.BOLD_API_KEY = "k"
        settings.BOLD_SECRET_KEY = "s"
        user = _create_user()
        order, _ = _order(user)
        data = _start(user, order)
        assert data["provider"] == "bold"
        assert "integritySignature" in data["config"]

    def test_system_check_refuses_simulated_in_production(self, settings):
        from apps.payments.checks import simulated_gateway_check
        settings.DEBUG = False
        settings.PAYMENTS_PROVIDER = "simulado"
        assert [e.id for e in simulated_gateway_check(None)] == ["payments.E001"]


@pytest.mark.django_db
class TestBootstrapDemo:
    def test_creates_demo_and_is_idempotent(self, settings, tmp_path):
        settings.DEBUG = True
        settings.MEDIA_ROOT = tmp_path
        call_command("bootstrap_demo", stdout=StringIO())
        admin = CustomUser.objects.get(email="admin@demo.local")
        assert admin.is_staff and admin.check_password("Admin-Demo-2026!")
        assert CustomUser.objects.get(email="cliente@demo.local").check_password("Cliente-Demo-2026!")
        sales = Order.objects.filter(status__in=["paid", "shipped", "delivered"]).count()
        assert sales > 10
        assert all(o.total == o.subtotal + o.shipping_cost for o in Order.objects.all())

        call_command("bootstrap_demo", stdout=StringIO())
        assert Order.objects.filter(status__in=["paid", "shipped", "delivered"]).count() == sales

    def test_refuses_outside_debug(self, settings):
        settings.DEBUG = False
        with pytest.raises(CommandError):
            call_command("bootstrap_demo", stdout=StringIO())
