import hashlib

from rest_framework.throttling import SimpleRateThrottle


class IdentityRateThrottle(SimpleRateThrottle):
    """Rate limit per client IP *and* per submitted account identifier.

    Keying on the e-mail means a wrong password only locks that account
    attempt, never everyone else's - even if the client IP can't be told
    apart behind the proxies (all visitors would then share one IP bucket).
    """

    identity_fields = ("email",)

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        num, period = rate.split("/")
        num_requests = int(num)
        # Support custom periods like "15min" / "2h"
        if period.endswith("min"):
            duration = int(period[:-3]) * 60
        elif period.endswith("hour"):
            duration = int(period[:-4] or 1) * 3600
        elif period.endswith("h") and period[:-1].isdigit():
            duration = int(period[:-1]) * 3600
        else:
            duration = {"s": 1, "m": 60, "h": 3600, "d": 86400}[period[0]]
        return (num_requests, duration)

    def _identity(self, request):
        data = request.data if hasattr(request, "data") else {}
        for field in self.identity_fields:
            value = data.get(field) if hasattr(data, "get") else None
            if isinstance(value, str) and value.strip():
                digest = hashlib.sha256(value.strip().lower().encode()).hexdigest()[:24]
                return f"{field}:{digest}"
        return "none"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{self.get_ident(request)}|{self._identity(request)}",
        }


class LoginRateThrottle(IdentityRateThrottle):
    scope = "login"
    rate = "5/15min"


class GoogleLoginRateThrottle(IdentityRateThrottle):
    scope = "login_google"
    rate = "20/15min"
    identity_fields = ("access_token",)


class RegisterRateThrottle(IdentityRateThrottle):
    scope = "register"
    rate = "5/hour"


class PasswordResetRateThrottle(IdentityRateThrottle):
    identity_fields = ("email", "uid")
    scope = "password_reset"
    rate = "5/hour"
