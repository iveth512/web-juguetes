from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.shipping.models import ShippingZone
from apps.shipping.serializers import ShippingZoneSerializer


class ShippingZoneViewSet(ReadOnlyModelViewSet):
    serializer_class = ShippingZoneSerializer
    queryset = ShippingZone.objects.filter(is_active=True)
    pagination_class = None
