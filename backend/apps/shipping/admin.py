from django.contrib import admin

from .models import ShippingZone


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = (
        "name", "price", "min_days", "max_days",
        "free_shipping_threshold", "is_active",
    )
    list_editable = ("price", "min_days", "max_days", "free_shipping_threshold", "is_active")
    search_fields = ("name",)
