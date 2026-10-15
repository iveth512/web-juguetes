"""Order pricing, creation and stock handling.

All money is in whole COP: Bold only accepts integer amounts, so every
figure is rounded to the peso before it is stored.
"""
import logging
from dataclasses import dataclass, field
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.products.models import Product, ProductVariant
from apps.shipping.services import shipping_cost_for

from .models import Coupon, Order, OrderItem

logger = logging.getLogger(__name__)

MIN_ORDER_TOTAL = Decimal("1000")  # Bold's minimum charge


class CheckoutError(Exception):
    pass


def to_pesos(value):
    return Decimal(value).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


@dataclass
class Line:
    product: Product
    variant: ProductVariant | None
    quantity: int
    price: Decimal


@dataclass
class Quote:
    lines: list = field(default_factory=list)
    subtotal: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    shipping_cost: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    coupon: Coupon | None = None


def build_quote(items, city, coupon_code="", lock=False):
    """Price a cart. With lock=True, rows are locked for update (use inside atomic)."""
    if not items:
        raise CheckoutError("El carrito está vacío.")

    product_ids = {i["product_id"] for i in items}
    variant_ids = {i["variant_id"] for i in items if i.get("variant_id")}

    products_qs = Product.objects.filter(id__in=product_ids, is_active=True)
    variants_qs = ProductVariant.objects.filter(id__in=variant_ids, is_active=True)
    if lock:
        # Deterministic lock order avoids deadlocks between concurrent checkouts.
        products_qs = products_qs.select_for_update().order_by("id")
        variants_qs = variants_qs.select_for_update().order_by("id")
    products = {p.id: p for p in products_qs}
    variants = {v.id: v for v in variants_qs}

    quote = Quote()
    for item in items:
        product = products.get(item["product_id"])
        if product is None:
            raise CheckoutError("Uno de los productos ya no está disponible.")

        variant = None
        variant_id = item.get("variant_id")
        if variant_id:
            variant = variants.get(variant_id)
            if variant is None or variant.product_id != product.id:
                raise CheckoutError(f"{product.name}: la variante ya no está disponible.")
        elif product.has_variants:
            raise CheckoutError(f"{product.name}: selecciona una variante.")

        stock = variant.stock if variant else product.stock
        if stock < item["quantity"]:
            raise CheckoutError(f"{product.name}: stock insuficiente.")

        price = to_pesos(variant.price if variant else product.base_price)
        quote.lines.append(Line(product, variant, item["quantity"], price))
        quote.subtotal += price * item["quantity"]

    coupon_code = (coupon_code or "").strip().upper()
    if coupon_code:
        coupons = Coupon.objects.filter(code=coupon_code)
        if lock:
            coupons = coupons.select_for_update()
        coupon = coupons.first()
        if coupon is None:
            raise CheckoutError("Cupón no válido.")
        valid, message = coupon.is_valid(subtotal=quote.subtotal)
        if not valid:
            raise CheckoutError(message)
        quote.coupon = coupon
        quote.discount = to_pesos(coupon.calculate_discount(quote.subtotal))

    quote.shipping_cost = to_pesos(shipping_cost_for(city, quote.subtotal))
    quote.total = quote.subtotal - quote.discount + quote.shipping_cost

    if quote.total < MIN_ORDER_TOTAL:
        raise CheckoutError(f"El total mínimo de compra es ${MIN_ORDER_TOTAL:,.0f}.".replace(",", "."))
    return quote


@transaction.atomic
def create_order(user, data):
    """Create a pending order, reserving stock and the coupon use."""
    quote = build_quote(
        data["items"],
        city=data["shipping_city"],
        coupon_code=data.get("coupon_code", ""),
        lock=True,
    )

    order = Order.objects.create(
        user=user,
        subtotal=quote.subtotal,
        discount=quote.discount,
        shipping_cost=quote.shipping_cost,
        total=quote.total,
        coupon=quote.coupon,
        shipping_name=data["shipping_name"],
        shipping_phone=data["shipping_phone"],
        shipping_address=data["shipping_address"],
        shipping_city=data["shipping_city"],
        shipping_department=data["shipping_department"],
        notes=data.get("notes", ""),
        status=Order.Status.PENDING,
    )

    for line in quote.lines:
        OrderItem.objects.create(
            order=order,
            product=line.product,
            variant=line.variant,
            variant_name=line.variant.name if line.variant else "",
            quantity=line.quantity,
            price=line.price,
        )
        _adjust_stock(line.product, line.variant, -line.quantity)

    if quote.coupon:
        quote.coupon.times_used += 1
        quote.coupon.save(update_fields=["times_used"])

    return order


def _adjust_stock(product, variant, delta):
    if variant is not None:
        variant.stock += delta
        variant.save()  # also re-syncs the product's aggregated stock
    else:
        product.stock += delta
        product.save()


def _lock_order(order):
    return Order.objects.select_for_update().get(pk=order.pk)


@transaction.atomic
def release_order(order, reason=""):
    """Cancel a pending order and give back its stock and coupon use.

    Returns False (and does nothing) if the order is no longer pending, so
    repeated calls can never restore stock twice.
    """
    order = _lock_order(order)
    if order.status != Order.Status.PENDING:
        return False

    for item in order.items.select_related("product", "variant"):
        product = Product.objects.select_for_update().get(pk=item.product_id)
        variant = (
            ProductVariant.objects.select_for_update().get(pk=item.variant_id)
            if item.variant_id else None
        )
        _adjust_stock(product, variant, item.quantity)

    if order.coupon_id:
        coupon = Coupon.objects.select_for_update().get(pk=order.coupon_id)
        if coupon.times_used > 0:
            coupon.times_used -= 1
            coupon.save(update_fields=["times_used"])

    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status", "updated_at"])
    logger.info("Order %s released: %s", order.pk, reason or "sin motivo")
    return True


def _try_reserve_again(order):
    """Re-take stock for a cancelled order that turned out to be paid."""
    items = list(order.items.all())
    products = {
        p.id: p for p in Product.objects.select_for_update()
        .filter(id__in=[i.product_id for i in items]).order_by("id")
    }
    variants = {
        v.id: v for v in ProductVariant.objects.select_for_update()
        .filter(id__in=[i.variant_id for i in items if i.variant_id]).order_by("id")
    }
    for item in items:
        target = variants[item.variant_id] if item.variant_id else products[item.product_id]
        if target.stock < item.quantity:
            return False
    for item in items:
        _adjust_stock(
            products[item.product_id],
            variants.get(item.variant_id),
            -item.quantity,
        )
    if order.coupon_id:
        coupon = Coupon.objects.select_for_update().get(pk=order.coupon_id)
        coupon.times_used += 1
        coupon.save(update_fields=["times_used"])
    return True


@transaction.atomic
def mark_order_paid(order):
    """Move an order to paid. Idempotent; returns True only on the transition."""
    order = _lock_order(order)
    if order.status == Order.Status.PAID or order.paid_at:
        return False

    if order.status == Order.Status.CANCELLED:
        # The customer paid after the reservation expired.
        if not _try_reserve_again(order):
            order.flag_attention(
                "Pago aprobado para un pedido ya cancelado y sin stock suficiente: "
                "despachar cuando haya stock o reembolsar."
            )
        else:
            order.flag_attention("Pago aprobado tras la expiracion del pedido; stock reservado de nuevo.")
    elif order.status != Order.Status.PENDING:
        order.flag_attention(f"Pago aprobado con el pedido en estado '{order.status}'.")
        order.save(update_fields=["requires_attention", "attention_reason", "updated_at"])
        return False

    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.save()
    return True


def pending_expiry_cutoff():
    return timezone.now() - timedelta(minutes=settings.PENDING_ORDER_TTL_MINUTES)


def order_expires_at(order):
    return order.created_at + timedelta(minutes=settings.PENDING_ORDER_TTL_MINUTES)
