import os
from pathlib import Path
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django.contrib.postgres",
    # Third party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    # Local apps
    "apps.products",
    "apps.shipping",
    "apps.imports",
    "seed",
    "apps.accounts",
    "apps.orders",
    "apps.reviews",
    "apps.payments",
    # Auth & social
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "juguetes_db",
        "USER": "juguetes_user",
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="db"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# Absolute in local Docker so image URLs work in the browser even when the
# request came from the Next.js server through the internal "backend" host.
MEDIA_URL = config("MEDIA_URL", default="media/")
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="", cast=Csv())
# Cookie-based JWT auth enforces CSRF; the frontend origin must be trusted.
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS", default=",".join(CORS_ALLOWED_ORIGINS), cast=Csv(),
)

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # No global anonymous limit: catalog pages are rendered by the Next.js
    # server, so all of those requests share one IP and a global anon limit
    # would throttle the whole store. Sensitive endpoints carry their own
    # throttles (login/register/password reset are keyed per e-mail too).
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": config("THROTTLE_USER", default="300/min"),
        "coupon": "20/min",
        "checkout": "10/min",
        "payment": "10/min",
        "payment_sync": "30/min",
        "dj_rest_auth": "120/min",
    },
    # Behind Nginx the client IP comes from X-Forwarded-For.
    "NUM_PROXIES": config("NUM_PROXIES", default=None, cast=lambda v: None if v in (None, "") else int(v)),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "JuguetesParaFrikis API",
    "DESCRIPTION": "API para el e-commerce de coleccionables",
    "VERSION": "1.0.0",
}

# ──────────────────────────────────────────────
# Auth & JWT Configuration
# ──────────────────────────────────────────────

SITE_ID = 1

AUTH_USER_MODEL = "accounts.CustomUser"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = [
    "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
]

# django-allauth
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "none"

# Email: console in development; set EMAIL_HOST etc. for real delivery.
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_TIMEOUT = 10
SEND_EMAILS_ASYNC = config("SEND_EMAILS_ASYNC", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL", default="JuguetesParaFrikis <noreply@juguetesparafrikis.com>",
)
ACCOUNT_USER_MODEL_USERNAME_FIELD = None

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": config("GOOGLE_CLIENT_ID", default=""),
            "secret": config("GOOGLE_CLIENT_SECRET", default=""),
        },
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
    }
}
# Google sign-in with an e-mail that already has a password account logs
# into that account (Google has verified the address) instead of failing.
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True

# djangorestframework-simplejwt
from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# dj-rest-auth
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "access_token",
    "JWT_AUTH_REFRESH_COOKIE": "refresh_token",
    "JWT_AUTH_HTTPONLY": True,
    "JWT_AUTH_SECURE": not DEBUG,
    "JWT_AUTH_SAMESITE": "Lax",
    # Off by default in dj-rest-auth: without it cookie-authenticated writes
    # skip CSRF checks entirely. The frontend sends X-CSRFToken.
    "JWT_AUTH_COOKIE_USE_CSRF": True,
    "USER_DETAILS_SERIALIZER": "apps.accounts.serializers.UserSerializer",
    "REGISTER_SERIALIZER": "apps.accounts.serializers.RegisterSerializer",
    "PASSWORD_RESET_SERIALIZER": "apps.accounts.serializers.PasswordResetSerializer",
    "OLD_PASSWORD_FIELD_ENABLED": True,
    "LOGOUT_ON_PASSWORD_CHANGE": False,
}

# Cache (Redis)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://redis:6379/1"),
    }
}

CORS_ALLOW_CREDENTIALS = True
# Lets the SPA read how long a throttled client must wait.
CORS_EXPOSE_HEADERS = ["Retry-After"]

# Bold (https://developers.bold.co). Keys come from the Bold panel:
# "llave de identidad" (BOLD_API_KEY) and "llave secreta" (BOLD_SECRET_KEY).
BOLD_API_KEY = config("BOLD_API_KEY", default="")
BOLD_SECRET_KEY = config("BOLD_SECRET_KEY", default="")
BOLD_ENVIRONMENT = config("BOLD_ENVIRONMENT", default="sandbox")  # sandbox | production
BOLD_API_URL = config("BOLD_API_URL", default="https://integrations.api.bold.co")

# "bold" (real gateway) or "simulado": a local-only test gateway with approve /
# reject buttons. "simulado" is refused unless DEBUG is on (payments.E001).
PAYMENTS_PROVIDER = config("PAYMENTS_PROVIDER", default="bold")

# Checkout
PENDING_ORDER_TTL_MINUTES = config("PENDING_ORDER_TTL_MINUTES", default=60, cast=int)
SHIPPING_DEFAULT_COST = config("SHIPPING_DEFAULT_COST", default="12000")
SHIPPING_FREE_THRESHOLD = config("SHIPPING_FREE_THRESHOLD", default="250000")

# URLs
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
BACKEND_URL = config("BACKEND_URL", default="http://localhost:8000")

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Hide the admin behind a non-obvious path in production (e.g. "gestion-x7k/").
ADMIN_URL = config("DJANGO_ADMIN_URL", default="admin/")
API_DOCS_ENABLED = config("API_DOCS_ENABLED", default=DEBUG, cast=bool)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
