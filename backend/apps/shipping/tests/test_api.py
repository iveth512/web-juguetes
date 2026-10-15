from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.shipping.models import ShippingZone


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestShippingZoneAPI:
    def test_list_zones(self, api_client):
        ShippingZone.objects.create(
            name="Bogota",
            price=Decimal("8000"),
            min_days=1,
            max_days=3,
        )
        url = reverse("shippingzone-list")
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data) >= 1
        assert response.data[0]["name"] == "Bogota"
