from rest_framework import serializers

from apps.shipping.models import ShippingZone


class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingZone
        fields = [
            "id",
            "name",
            "price",
            "min_days",
            "max_days",
            "free_shipping_threshold",
        ]
