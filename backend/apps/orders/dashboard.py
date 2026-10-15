"""Sales dashboard API (admins only).

A "sale" is an order that was paid: status paid, shipped or delivered.
Sales are dated by when they were paid (falling back to creation for
orders paid before paid_at existed), in the store's time zone.
"""
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.db.models import Avg, Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from core.pagination import StandardPagination

from .models import Order, OrderItem

SALE_STATUSES = [Order.Status.PAID, Order.Status.SHIPPED, Order.Status.DELIVERED]
DEFAULT_RANGE_DAYS = 30
MAX_RANGE_DAYS = 366


class RangeError(Exception):
    pass


def parse_range(params):
    """Inclusive [desde, hasta] dates from ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD."""
    today = timezone.localdate()
    try:
        end = date.fromisoformat(params["hasta"]) if params.get("hasta") else today
        start = (
            date.fromisoformat(params["desde"]) if params.get("desde")
            else end - timedelta(days=DEFAULT_RANGE_DAYS - 1)
        )
    except ValueError:
        raise RangeError("Las fechas deben tener el formato AAAA-MM-DD.")
    if start > end:
        raise RangeError("La fecha inicial no puede ser posterior a la final.")
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        raise RangeError(f"El rango maximo es de {MAX_RANGE_DAYS} dias.")
    return start, end


def _bounds(start, end):
    tz = timezone.get_current_timezone()
    return (
        timezone.make_aware(datetime.combine(start, time.min), tz),
        timezone.make_aware(datetime.combine(end + timedelta(days=1), time.min), tz),
    )


def sales_queryset(start, end):
    lower, upper = _bounds(start, end)
    return (
        Order.objects.filter(status__in=SALE_STATUSES)
        .annotate(sold_at=Coalesce("paid_at", "created_at"))
        .filter(sold_at__gte=lower, sold_at__lt=upper)
    )


def _money(value):
    return f"{(value or Decimal('0')):.2f}"


class _RangeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            start, end = parse_range(request.query_params)
        except RangeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.build(request, start, end))

    def build(self, request, start, end):
        raise NotImplementedError


class DashboardSummaryView(_RangeView):
    def build(self, request, start, end):
        sales = sales_queryset(start, end)
        totals = sales.aggregate(
            revenue=Sum("total"),
            orders=Count("id"),
            average=Avg("total"),
            customers=Count("user", distinct=True),
        )
        units = OrderItem.objects.filter(order__in=sales.values("pk")).aggregate(u=Sum("quantity"))["u"]
        return {
            "desde": start.isoformat(),
            "hasta": end.isoformat(),
            "ventas_total": _money(totals["revenue"]),
            "pedidos": totals["orders"],
            "ticket_promedio": _money(totals["average"]),
            "unidades_vendidas": units or 0,
            "clientes": totals["customers"],
            # Current state, independent of the range:
            "pedidos_pendientes_pago": Order.objects.filter(status=Order.Status.PENDING).count(),
            "pedidos_por_despachar": Order.objects.filter(status=Order.Status.PAID).count(),
            "pedidos_requieren_atencion": Order.objects.filter(requires_attention=True).count(),
            "productos_bajo_stock": Product.objects.filter(
                is_active=True, stock__lte=F("low_stock_threshold"),
            ).count(),
        }


class SalesByDayView(_RangeView):
    def build(self, request, start, end):
        rows = (
            sales_queryset(start, end)
            .annotate(dia=TruncDate("sold_at", tzinfo=timezone.get_current_timezone()))
            .values("dia")
            .annotate(total=Sum("total"), pedidos=Count("id"))
        )
        by_day = {row["dia"]: row for row in rows}
        days = []
        current = start
        while current <= end:  # every day, zeros included, so charts have no gaps
            row = by_day.get(current)
            days.append({
                "fecha": current.isoformat(),
                "total": _money(row["total"] if row else None),
                "pedidos": row["pedidos"] if row else 0,
            })
            current += timedelta(days=1)
        return {"desde": start.isoformat(), "hasta": end.isoformat(), "dias": days}


class SalesByProductView(_RangeView):
    def build(self, request, start, end):
        try:
            limit = min(max(int(request.query_params.get("limite", 10)), 1), 50)
        except ValueError:
            limit = 10
        line_total = ExpressionWrapper(
            F("price") * F("quantity"), output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        rows = (
            OrderItem.objects.filter(order__in=sales_queryset(start, end).values("pk"))
            .values("product_id", "product__name", "product__sku")
            .annotate(unidades=Sum("quantity"), ingresos=Sum(line_total), pedidos=Count("order", distinct=True))
            .order_by("-ingresos", "-unidades")[:limit]
        )
        return {
            "desde": start.isoformat(),
            "hasta": end.isoformat(),
            "productos": [
                {
                    "product_id": str(r["product_id"]),
                    "nombre": r["product__name"],
                    "sku": r["product__sku"],
                    "unidades": r["unidades"],
                    "pedidos": r["pedidos"],
                    "ingresos": _money(r["ingresos"]),
                }
                for r in rows
            ],
        }


class AdminOrderSerializer(serializers.ModelSerializer):
    cliente_email = serializers.EmailField(source="user.email", read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    unidades = serializers.IntegerField(read_only=True)
    metodo_pago = serializers.SerializerMethodField()
    productos = serializers.SerializerMethodField()
    sold_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "status", "created_at", "paid_at", "sold_at", "total", "subtotal",
            "discount", "shipping_cost", "shipping_city", "cliente_email",
            "cliente_nombre", "unidades", "metodo_pago", "productos",
            "tracking_number", "requires_attention",
        ]

    def get_cliente_nombre(self, obj):
        return obj.shipping_name or obj.user.get_full_name()

    def get_metodo_pago(self, obj):
        approved = [p for p in obj.payments.all() if p.status == "approved"]
        return approved[0].payment_method if approved else ""

    def get_productos(self, obj):
        return [
            {"nombre": i.product.name, "variante": i.variant_name, "cantidad": i.quantity}
            for i in obj.items.all()
        ]


class AdminOrderHistoryView(APIView):
    """Sales history with filters: ?desde&hasta&estado&q (email, name or order id)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        params = request.query_params
        try:
            start, end = parse_range(params)
        except RangeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        estado = params.get("estado", "ventas")
        if estado == "todos":
            lower, upper = _bounds(start, end)
            qs = Order.objects.annotate(sold_at=Coalesce("paid_at", "created_at")).filter(
                created_at__gte=lower, created_at__lt=upper,
            )
        elif estado == "ventas":
            qs = sales_queryset(start, end)
        elif estado in Order.Status.values:
            lower, upper = _bounds(start, end)
            qs = Order.objects.annotate(sold_at=Coalesce("paid_at", "created_at")).filter(
                status=estado, created_at__gte=lower, created_at__lt=upper,
            )
        else:
            return Response({"detail": "Estado no valido."}, status=status.HTTP_400_BAD_REQUEST)

        q = params.get("q", "").strip()
        if q:
            match = Q(user__email__icontains=q) | Q(shipping_name__icontains=q)
            if len(q) >= 4 and all(c in "0123456789abcdef-" for c in q.lower()):
                match |= Q(id__startswith=q.lower())  # "Pedido #DC2C965A"
            qs = qs.filter(match)

        qs = (
            qs.select_related("user")
            .prefetch_related("items__product", "payments")
            .annotate(unidades=Sum("items__quantity"))
            .order_by("-sold_at")
        )
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(AdminOrderSerializer(page, many=True).data)
