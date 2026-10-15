from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.shipping.views import ShippingZoneViewSet

router = DefaultRouter()
router.register("shipping-zones", ShippingZoneViewSet, basename="shippingzone")

urlpatterns = [
    path("", include(router.urls)),
]
