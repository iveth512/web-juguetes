import uuid

import requests
from django.conf import settings
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.serializers import SocialLoginSerializer
from dj_rest_auth.registration.views import RegisterView as BaseRegisterView
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.views import LoginView as BaseLoginView
from dj_rest_auth.views import PasswordResetConfirmView as BasePasswordResetConfirmView
from dj_rest_auth.views import PasswordResetView as BasePasswordResetView
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import serializers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
from .models import WishlistItem
from .throttles import (
    GoogleLoginRateThrottle,
    LoginRateThrottle,
    PasswordResetRateThrottle,
    RegisterRateThrottle,
)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """Sets the csrftoken cookie and returns it, for the SPA to send back as X-CSRFToken."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginView(BaseLoginView):
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and not request.data.get("remember"):
            # Without "remember me" the refresh cookie lives only for the browser session.
            refresh_cookie = response.cookies.get("refresh_token")
            if refresh_cookie:
                refresh_cookie["expires"] = ""
                refresh_cookie["max-age"] = ""
        return response


class RegisterView(BaseRegisterView):
    throttle_classes = [RegisterRateThrottle]


class PasswordResetView(BasePasswordResetView):
    throttle_classes = [PasswordResetRateThrottle]


class PasswordResetConfirmView(BasePasswordResetConfirmView):
    throttle_classes = [PasswordResetRateThrottle]


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def google_token_audience(access_token):
    """Return the client id a Google access token was issued to, or None."""
    try:
        resp = requests.get(GOOGLE_TOKENINFO_URL, params={"access_token": access_token}, timeout=5)
    except requests.RequestException:
        return None
    if not resp.ok:
        return None
    data = resp.json()
    return data.get("aud") or data.get("azp")


class GoogleAccessTokenSerializer(SocialLoginSerializer):
    """Google sign-in with the access token from @react-oauth/google.

    allauth only fetches the profile with the token, so first make sure the
    token was issued to *our* client id; otherwise a token obtained by any
    other app could be replayed here to log in as that user.
    """

    def validate(self, attrs):
        access_token = attrs.get("access_token")
        if not access_token:
            raise serializers.ValidationError("Token de Google requerido.")
        expected = settings.SOCIALACCOUNT_PROVIDERS["google"]["APP"]["client_id"]
        if not expected or google_token_audience(access_token) != expected:
            raise serializers.ValidationError("Token de Google no válido.")
        attrs.pop("id_token", None)
        attrs.pop("code", None)
        return super().validate(attrs)


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    serializer_class = GoogleAccessTokenSerializer
    throttle_classes = [GoogleLoginRateThrottle]


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related(
            "product", "product__category", "product__franchise"
        )
        products = [item.product for item in items]
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    def create(self, request):
        product_id = request.data.get("product_id")
        if not product_id:
            return Response({"detail": "product_id requerido"}, status=status.HTTP_400_BAD_REQUEST)
        product = Product.objects.filter(pk=product_id, is_active=True).first() if _is_uuid(product_id) else None
        if product is None:
            return Response({"detail": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=product
        )
        if not created:
            return Response({"detail": "Ya está en favoritos"}, status=status.HTTP_200_OK)
        return Response({"detail": "Agregado a favoritos"}, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=pk).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)


def _is_uuid(value):
    try:
        uuid.UUID(str(value))
    except ValueError:
        return False
    return True
