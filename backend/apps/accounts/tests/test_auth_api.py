import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def disable_email_verification_and_throttling(settings):
    settings.ACCOUNT_EMAIL_VERIFICATION = "none"
    # Override caches to use local memory so throttling doesn't persist across tests
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
    from django.core.cache import cache
    cache.clear()


class TestRegisterAPI:
    def setup_method(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/register/"

    def test_register_success(self):
        data = {
            "email": "nuevo@example.com",
            "password1": "StrongPass123",
            "password2": "StrongPass123",
            "first_name": "Juan",
            "last_name": "Perez",
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert User.objects.filter(email="nuevo@example.com").exists()

    def test_register_password_mismatch(self):
        data = {
            "email": "fail@example.com",
            "password1": "StrongPass123",
            "password2": "DifferentPass456",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

    def test_register_duplicate_email(self):
        User.objects.create_user(
            email="dup@example.com", password="Pass1234", first_name="A", last_name="B"
        )
        data = {
            "email": "dup@example.com",
            "password1": "StrongPass123",
            "password2": "StrongPass123",
            "first_name": "C",
            "last_name": "D",
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400


class TestLoginAPI:
    def setup_method(self):
        self.client = APIClient()
        self.url = "/api/v1/auth/login/"
        self.user = User.objects.create_user(
            email="login@example.com",
            password="TestPass123",
            first_name="Login",
            last_name="User",
        )

    def test_login_success(self):
        data = {"email": "login@example.com", "password": "TestPass123"}
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert "access_token" in response.cookies

    def test_login_wrong_password(self):
        data = {"email": "login@example.com", "password": "WrongPass"}
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

    def test_login_remember_me(self):
        data = {"email": "login@example.com", "password": "TestPass123", "remember": True}
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200


class TestUserProfileAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="profile@example.com",
            password="TestPass123",
            first_name="Profile",
            last_name="User",
        )

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/auth/user/")
        assert response.status_code == 200
        assert response.data["email"] == "profile@example.com"

    def test_get_profile_unauthenticated(self):
        response = self.client.get("/api/v1/auth/user/")
        assert response.status_code == 401

    def test_update_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            "/api/v1/auth/user/",
            {"phone": "3001234567", "city": "Bogota"},
            format="json",
        )
        assert response.status_code == 200
        self.user.refresh_from_db()
        assert self.user.phone == "3001234567"
