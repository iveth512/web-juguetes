from django.contrib import admin

from .models import Payment, PaymentEvent


class PaymentEventInline(admin.TabularInline):
    model = PaymentEvent
    extra = 0
    can_delete = False
    fields = ("event_type", "event_id", "received_at")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "order", "provider", "amount", "status", "payment_method", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("reference", "provider_payment_id", "order__id", "order__user__email")
    readonly_fields = [f.name for f in Payment._meta.fields]
    inlines = [PaymentEventInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "event_id", "payment", "received_at")
    list_filter = ("event_type",)
    search_fields = ("event_id", "payment__reference")
    readonly_fields = [f.name for f in PaymentEvent._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
