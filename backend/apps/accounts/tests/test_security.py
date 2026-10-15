import re
from unittest.mock import patch

import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.tests.test_checkout_api import _checkout_payload, _create_product

PASSWORD = "Coleccion-2026!"


def _user(email="cliente@test.com"):
    return CustomUser.objects.create_user(
        email=email, password=PASSWORD, first_name="Ana", last_name="Gomez",
    )


def _login(client, email="cliente@test.com", remember=False):
    resp = client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": PASSWORD, "remember": remember},
        format="json",
    )
    assert resp.status_code == 200, resp.data
    return resp


@pytest.mark.django_db
class TestCsrfWithCookieAuth:
    """Real cookie auth (no force_authenticate), the way the browser talks to the API."""

    def test_write_without_csrf_token_is_rejected(self):
        _user()
        product = _create_product()
        client = APIClient(enforce_csrf_checks=True)
        _login(client)

        resp = client.post("/api/v1/checkout/", _checkout_payload(product), format="json")
        assert resp.status_code == 403

    def test_write_with_csrf_token_succeeds(self):
        _user()
        product = _create_product()
        client = APIClient(enforce_csrf_checks=True)
        _login(client)

        token = client.get("/api/v1/auth/csrf/").data["csrfToken"]
        resp = client.post(
            "/api/v1/checkout/", _checkout_payload(product), format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        assert resp.status_code == 201, resp.data

    def test_csrf_endpoint_sets_cookie(self):
        resp = APIClient().get("/api/v1/auth/csrf/")
        assert resp.status_code == 200
        assert "csrftoken" in resp.cookies


@pytest.mark.django_db
class TestRememberMe:
    def test_without_remember_refresh_cookie_is_session_only(self):
        _user()
        resp = _login(APIClient(), remember=False)
        cookie = resp.cookies["refresh_token"]
        assert not cookie["max-age"] and not cookie["expires"]
        assert cookie["httponly"]

    def test_with_remember_refresh_cookie_persists(self):
        _user()
        resp = _login(APIClient(), remember=True)
        assert resp.cookies["refresh_token"]["expires"]


@pytest.mark.django_db
class TestPasswordReset:
    def test_reset_email_links_to_frontend_and_confirm_works(self, settings):
        settings.FRONTEND_URL = "https://tienda.test"
        user = _user()
        client = APIClient()

        resp = client.post("/api/v1/auth/password/reset/", {"email": user.email}, format="json")
        assert resp.status_code == 200
        assert len(mail.outbox) == 1
        match = re.search(
            r"https://tienda\.test/restablecer-contrasena\?uid=([^&\s]+)&token=([^\s]+)",
            mail.outbox[0].body,
        )
        assert match, mail.outbox[0].body
        uid, token = match.groups()

        resp = client.post("/api/v1/auth/password/reset/confirm/", {
            "uid": uid, "token": token,
            "new_password1": "Otra-Clave-2026!", "new_password2": "Otra-Clave-2026!",
        }, format="json")
        assert resp.status_code == 200, resp.data
        user.refresh_from_db()
        assert user.check_password("Otra-Clave-2026!")

    def test_unknown_email_does_not_reveal_accounts(self):
        resp = APIClient().post(
            "/api/v1/auth/password/reset/", {"email": "nadie@test.com"}, format="json",
        )
        assert resp.status_code == 200

    def test_invalid_token_is_rejected(self):
        _user()
        resp = APIClient().post("/api/v1/auth/password/reset/confirm/", {
            "uid": "x", "token": "invalid",
            "new_password1": "Otra-Clave-2026!", "new_password2": "Otra-Clave-2026!",
        }, format="json")
        assert resp.status_code == 400

    def test_password_change_requires_old_password(self):
        _user()
        client = APIClient()
        _login(client)
        resp = client.post("/api/v1/auth/password/change/", {
            "new_password1": "Otra-Clave-2026!", "new_password2": "Otra-Clave-2026!",
        }, format="json")
        assert resp.status_code == 400


@pytest.mark.django_db
class TestGoogleLogin:
    @pytest.fixture(autouse=True)
    def google_client_id(self, settings):
        settings.SOCIALACCOUNT_PROVIDERS = {
            "google": {"APP": {"client_id": "nuestro-client-id", "secret": "x"}, "SCOPE": ["profile", "email"]},
        }

    def test_token_for_another_app_is_rejected(self):
        with patch("apps.accounts.views.google_token_audience", return_value="otra-app"):
            resp = APIClient().post("/api/v1/auth/google/", {"access_token": "tok"}, format="json")
        assert resp.status_code == 400
        assert not CustomUser.objects.exists()

    def test_missing_token_is_rejected(self):
        resp = APIClient().post("/api/v1/auth/google/", {}, format="json")
        assert resp.status_code == 400


@pytest.mark.django_db
class TestThrottling:
    def test_login_is_rate_limited(self):
        client = APIClient()
        statuses = [
            client.post("/api/v1/auth/login/", {"email": "x@test.com", "password": "bad"}, format="json").status_code
            for _ in range(6)
        ]
        assert statuses[-1] == 429

    def test_locked_email_does_not_block_other_accounts(self):
        # Behind the proxies every visitor may look like the same IP: one
        # person's failed attempts must not lock everybody else out.
        _user()
        client = APIClient()
        for _ in range(6):
            client.post("/api/v1/auth/login/", {"email": "atacante@test.com", "password": "bad"}, format="json")
        assert client.post("/api/v1/auth/login/", {"email": "atacante@test.com", "password": "bad"}, format="json").status_code == 429
        _login(client)  # cliente@test.com from the same IP still gets in

    def test_email_case_does_not_bypass_limit(self):
        client = APIClient()
        for email in ["X@test.com", "x@TEST.com", " x@test.com", "x@test.com", "X@Test.com"]:
            client.post("/api/v1/auth/login/", {"email": email, "password": "bad"}, format="json")
        resp = client.post("/api/v1/auth/login/", {"email": "x@test.com", "password": "bad"}, format="json")
        assert resp.status_code == 429

    def test_register_limit_is_per_email(self):
        client = APIClient()
        payload = {"password1": "Coleccion-2026!", "password2": "Coleccion-2026!", "first_name": "Ana", "last_name": "Gomez"}
        for i in range(6):
            client.post("/api/v1/auth/register/", {**payload, "email": "repetido@test.com"}, format="json")
        assert client.post("/api/v1/auth/register/", {**payload, "email": "repetido@test.com"}, format="json").status_code == 429
        assert client.post("/api/v1/auth/register/", {**payload, "email": "nueva@test.com"}, format="json").status_code in (200, 201, 204)

    def test_catalog_has_no_global_anonymous_limit(self):
        client = APIClient()
        statuses = {client.get("/api/v1/categories/").status_code for _ in range(150)}
        assert statuses == {200}

    def test_coupon_validation_is_rate_limited(self):
        client = APIClient()
        statuses = [
            client.post("/api/v1/coupons/validate/", {"code": f"X{i}", "subtotal": "1000"}, format="json").status_code
            for i in range(21)
        ]
        assert statuses[-1] == 429


@pytest.mark.django_db
class TestWishlistInput:
    def test_invalid_product_id_is_404_not_500(self):
        _user()
        client = APIClient()
        _login(client)
        resp = client.post("/api/v1/wishlist/", {"product_id": "no-es-uuid"}, format="json")
        assert resp.status_code == 404


@pytest.mark.django_db
class TestRegisterDuplicates:
    def test_duplicate_email_is_a_clear_400_not_500(self):
        _user(email="existe@test.com")
        payload = {"email": "EXISTE@test.com", "password1": PASSWORD, "password2": PASSWORD,
                   "first_name": "Ana", "last_name": "Gomez"}
        resp = APIClient().post("/api/v1/auth/register/", payload, format="json")
        assert resp.status_code == 400
        assert "Ya existe una cuenta" in str(resp.data)


@pytest.mark.django_db
class TestGoogleLoginFlow:
    """End to end through allauth, with Google's two HTTP calls mocked."""

    CLIENT_ID = "nuestro-client-id.apps.googleusercontent.com"

    @pytest.fixture(autouse=True)
    def google_settings(self, settings):
        settings.SOCIALACCOUNT_PROVIDERS = {
            "google": {"APP": {"client_id": self.CLIENT_ID, "secret": "x"}, "SCOPE": ["profile", "email"]},
        }

    def _login(self, profile):
        with patch("apps.accounts.views.google_token_audience", return_value=self.CLIENT_ID), \
             patch("allauth.socialaccount.providers.google.views.GoogleOAuth2Adapter._fetch_user_info", return_value=profile):
            return APIClient().post("/api/v1/auth/google/", {"access_token": "ya29.token"}, format="json")

    def _profile(self, email="nuevo@gmail.com", sub="1001"):
        return {"sub": sub, "email": email, "email_verified": True, "given_name": "Nuevo", "family_name": "Google"}

    def test_new_google_user_is_created_and_logged_in(self):
        resp = self._login(self._profile())
        assert resp.status_code == 200, resp.data
        assert "access_token" in resp.cookies
        user = CustomUser.objects.get(email="nuevo@gmail.com")
        assert (user.first_name, user.last_name) == ("Nuevo", "Google")
        assert not user.is_staff

    def test_same_google_user_logs_in_again(self):
        assert self._login(self._profile()).status_code == 200
        assert self._login(self._profile()).status_code == 200
        assert CustomUser.objects.filter(email="nuevo@gmail.com").count() == 1

    def test_existing_password_account_is_linked_not_rejected(self):
        existing = _user(email="cliente@gmail.com")
        resp = self._login(self._profile(email="cliente@gmail.com", sub="2002"))
        assert resp.status_code == 200, resp.data
        assert CustomUser.objects.filter(email__iexact="cliente@gmail.com").count() == 1
        assert existing.socialaccount_set.filter(provider="google").exists()
