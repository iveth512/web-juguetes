from django.contrib import admin, messages
from django.db import transaction
from django.utils import timezone

from apps.payments.models import Payment

from .emails import send_order_shipped_email
from .models import Coupon, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ("product", "variant_name", "quantity", "price")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    can_delete = False
    fields = ("reference", "status", "amount", "payment_method", "provider_payment_id", "created_at")
    readonly_fields = fields
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline, PaymentInline]
    list_display = ("short_id", "user", "status", "total", "requires_attention", "created_at")
    list_filter = ("status", "requires_attention")
    search_fields = ("id", "user__email", "shipping_name", "tracking_number")
    readonly_fields = (
        "id", "user", "subtotal", "discount", "shipping_cost", "total", "coupon",
        "paid_at", "shipped_at", "created_at", "updated_at",
    )
    fieldsets = (
        (None, {"fields": ("id", "user", "status", "created_at", "updated_at")}),
        ("Atencion", {"fields": ("requires_attention", "attention_reason")}),
        ("Valores", {"fields": ("subtotal", "discount", "coupon", "shipping_cost", "total", "paid_at")}),
        ("Envío", {"fields": (
            "shipping_name", "shipping_phone", "shipping_address", "shipping_city",
            "shipping_department", "shipping_carrier", "tracking_number", "shipped_at", "notes",
        )}),
    )
    actions = ["mark_shipped", "mark_delivered"]

    @admin.display(description="Pedido")
    def short_id(self, obj):
        return obj.short_id

    def save_model(self, request, obj, form, change):
        previous = Order.objects.filter(pk=obj.pk).values_list("status", flat=True).first()
        if obj.status == Order.Status.SHIPPED and previous != Order.Status.SHIPPED:
            if previous != Order.Status.PAID:
                messages.error(request, "Solo se pueden enviar pedidos pagados; estado no cambiado.")
                obj.status = previous
            else:
                obj.shipped_at = timezone.now()
                transaction.on_commit(lambda: send_order_shipped_email(obj))
        super().save_model(request, obj, form, change)

    @admin.action(description="Marcar como enviado (notifica al cliente)")
    def mark_shipped(self, request, queryset):
        count = 0
        for order in queryset.filter(status=Order.Status.PAID):
            order.status = Order.Status.SHIPPED
            order.shipped_at = timezone.now()
            order.save(update_fields=["status", "shipped_at", "updated_at"])
            send_order_shipped_email(order)
            count += 1
        self.message_user(request, f"{count} pedido(s) marcados como enviados. Solo aplica a pedidos pagados.")

    @admin.action(description="Marcar como entregado")
    def mark_delivered(self, request, queryset):
        count = queryset.filter(status=Order.Status.SHIPPED).update(
            status=Order.Status.DELIVERED, updated_at=timezone.now(),
        )
        self.message_user(request, f"{count} pedido(s) marcados como entregados.")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "min_purchase",
        "times_used",
        "max_uses",
        "is_active",
        "valid_until",
    )
    list_filter = ("is_active", "discount_type")
    search_fields = ("code",)
    list_editable = ("is_active",)
