import os

from .base import *  # noqa: F401, F403

DEBUG = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = False  # Nginx handles SSL
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Security headers
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

SILENCED_SYSTEM_CHECKS = [
    "security.W008",  # HTTPS redirect is done by Nginx
    "security.W021",  # HSTS preload is opt-in; enable once the domain is stable
]

# JWT cookies secure in production
REST_AUTH["JWT_AUTH_SECURE"] = True  # noqa: F405

# Client IP for throttling comes from Nginx's X-Forwarded-For.
if REST_FRAMEWORK["NUM_PROXIES"] is None:  # noqa: F405
    REST_FRAMEWORK["NUM_PROXIES"] = 1  # noqa: F405

# Static files
STATIC_ROOT = "/app/staticfiles"

# Database host from environment
DATABASES["default"]["HOST"] = os.environ.get("DB_HOST", "juguetes_postgres")  # noqa: F405
DATABASES["default"]["PORT"] = os.environ.get("DB_PORT", "5432")  # noqa: F405

# Redis - use juguetes_redis container
CACHES["default"]["LOCATION"] = os.environ.get("REDIS_URL", "redis://juguetes_redis:6379/1")  # noqa: F405
