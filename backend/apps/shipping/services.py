import unicodedata
from decimal import Decimal

from django.conf import settings

from apps.shipping.models import ShippingZone

FALLBACK_ZONE_NAME = "resto del pais"


def _normalize(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(c for c in value if not unicodedata.combining(c))
    return " ".join(value.lower().split())


def find_zone(city):
    """Return the active zone matching `city`, else the 'Resto del pais' zone."""
    zones = list(ShippingZone.objects.filter(is_active=True))
    by_name = {_normalize(z.name): z for z in zones}
    return by_name.get(_normalize(city)) or by_name.get(FALLBACK_ZONE_NAME)


def shipping_cost_for(city, subtotal):
    """Shipping cost in COP for a destination city and order subtotal."""
    zone = find_zone(city)
    if zone is None:
        price = Decimal(settings.SHIPPING_DEFAULT_COST)
        threshold = Decimal(settings.SHIPPING_FREE_THRESHOLD)
    else:
        price = zone.price
        threshold = zone.free_shipping_threshold

    if threshold is not None and subtotal >= threshold:
        return Decimal("0")
    return price
