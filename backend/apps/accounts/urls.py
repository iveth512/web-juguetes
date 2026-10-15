from django.urls import path
from dj_rest_auth.views import UserDetailsView, LogoutView, PasswordChangeView
from dj_rest_auth.jwt_auth import get_refresh_view
from .views import (
    CsrfTokenView,
    GoogleLoginView,
    LoginView,
    PasswordResetConfirmView,
    PasswordResetView,
    RegisterView,
    WishlistViewSet,
)

urlpatterns = [
    path("auth/csrf/", CsrfTokenView.as_view(), name="csrf-token"),
    path("auth/register/", RegisterView.as_view(), name="rest_register"),
    path("auth/login/", LoginView.as_view(), name="rest_login"),
    path("auth/google/", GoogleLoginView.as_view(), name="google_login"),
    path("auth/logout/", LogoutView.as_view(), name="rest_logout"),
    path("auth/token/refresh/", get_refresh_view().as_view(), name="token_refresh"),
    path("auth/user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("auth/password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
    path("auth/password/reset/", PasswordResetView.as_view(), name="rest_password_reset"),
    path("auth/password/reset/confirm/", PasswordResetConfirmView.as_view(), name="rest_password_reset_confirm"),
    path("wishlist/", WishlistViewSet.as_view({"get": "list", "post": "create"}), name="wishlist-list"),
    path("wishlist/<uuid:pk>/", WishlistViewSet.as_view({"delete": "destroy"}), name="wishlist-detail"),
]
