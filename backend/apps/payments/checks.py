from django.conf import settings
from django.core.checks import Error, Warning, register


@register()
def simulated_gateway_check(app_configs, **kwargs):
    # The simulated gateway approves any payment at the press of a button.
    if settings.PAYMENTS_PROVIDER == "simulado" and not settings.DEBUG:
        return [Error(
            "PAYMENTS_PROVIDER='simulado' solo se permite con DEBUG=True (entorno local).",
            id="payments.E001",
        )]
    if settings.PAYMENTS_PROVIDER not in ("bold", "simulado"):
        return [Error(
            f"PAYMENTS_PROVIDER desconocido: {settings.PAYMENTS_PROVIDER!r}. Usa 'bold' o 'simulado'.",
            id="payments.E002",
        )]
    return []


@register(deploy=True)
def bold_settings_check(app_configs, **kwargs):
    if settings.PAYMENTS_PROVIDER != "bold":
        return []
    issues = []
    if settings.BOLD_ENVIRONMENT != "production":
        issues.append(Warning(
            "BOLD_ENVIRONMENT no es 'production': los webhooks se validan con la "
            "llave vacia del sandbox y cualquiera podria falsificarlos.",
            id="payments.W001",
        ))
    if not (settings.BOLD_API_KEY and settings.BOLD_SECRET_KEY):
        issues.append(Warning(
            "Faltan BOLD_API_KEY / BOLD_SECRET_KEY: no se podran cobrar pedidos.",
            id="payments.W002",
        ))
    return issues
