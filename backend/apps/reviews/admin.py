from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "rating", "is_verified_purchase", "created_at")
    list_filter = ("rating", "is_verified_purchase")
    search_fields = ("user__email", "product__name", "title")
    readonly_fields = ("is_verified_purchase", "created_at")
