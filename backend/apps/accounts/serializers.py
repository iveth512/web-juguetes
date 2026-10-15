from allauth.account.utils import user_pk_to_url_str
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer as BasePasswordResetSerializer
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


def frontend_password_reset_url(request, user, temp_key):
    uid = user_pk_to_url_str(user)
    return f"{settings.FRONTEND_URL}/restablecer-contrasena?uid={uid}&token={temp_key}"


class PasswordResetSerializer(BasePasswordResetSerializer):
    """Reset emails link to the Next.js page instead of the backend."""

    def get_email_options(self):
        return {"url_generator": frontend_password_reset_url}


class RegisterSerializer(BaseRegisterSerializer):
    username = None
    first_name = serializers.CharField(required=True, min_length=2)
    last_name = serializers.CharField(required=True, min_length=2)

    def validate_email(self, email):
        email = super().validate_email(email)
        # allauth's anti-enumeration mode lets a duplicate through and the
        # unique constraint then fails with a 500; answer clearly instead.
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña."
            )
        return email.lower()

    def custom_signup(self, request, user):
        user.first_name = self.validated_data.get("first_name", "")
        user.last_name = self.validated_data.get("last_name", "")
        user.save()

    def get_fields(self):
        fields = super().get_fields()
        fields.pop("username", None)
        return fields


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone", "address", "city", "department", "is_staff")
        read_only_fields = ("id", "email", "is_staff")
