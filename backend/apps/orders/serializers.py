from rest_framework import serializers

from .models import Order, OrderItem
from .services import order_expires_at


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)


# ── Checkout (write) ──────────────────────────────────────────────


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, max_value=50)


class QuoteSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True, allow_empty=False, max_length=50)
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    coupon_code = serializers.CharField(max_length=30, required=False, allow_blank=True)


class CheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True, allow_empty=False, max_length=50)
    shipping_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField(max_length=200)
    shipping_city = serializers.CharField(max_length=100)
    shipping_department = serializers.CharField(max_length=100)
    coupon_code = serializers.CharField(max_length=30, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)


# ── Order (read) ──────────────────────────────────────────────────


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "product_slug",
            "product_image",
            "variant_name",
            "quantity",
            "price",
        ]

    def get_product_image(self, obj):
        request = self.context.get("request")
        primary = next(
            (img for img in obj.product.images.all() if img.is_primary), None
        )
        if primary and primary.image and request:
            return request.build_absolute_uri(primary.image.url)
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    coupon = serializers.CharField(source="coupon.code", read_only=True, default=None)
    expires_at = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "subtotal",
            "discount",
            "shipping_cost",
            "total",
            "shipping_name",
            "shipping_address",
            "shipping_city",
            "shipping_department",
            "shipping_carrier",
            "tracking_number",
            "coupon",
            "notes",
            "created_at",
            "paid_at",
            "shipped_at",
            "expires_at",
            "items",
        ]

    def get_expires_at(self, obj):
        if obj.status != Order.Status.PENDING:
            return None
        return order_expires_at(obj)
