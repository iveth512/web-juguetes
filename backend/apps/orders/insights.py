"""Business analysis for the admin panel (staff only).

Uses the dashboard's definition of a sale, its date range and its net sales
(subtotal - discount) for order-level amounts. Unit cost is the
product's landed cost (total_cost_cop plus local shipping); products without a
cost report costo=null and stay out of the margin totals. Costs are the current
ones, not a snapshot at the time of sale.
"""
from collections import Counter, defaultdict
from decimal import Decimal

from django.db.models import Max
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.products.models import Product
from apps.shipping.models import ShippingZone

from .dashboard import SALE_STATUSES, _money, _RangeView, sales_queryset
from .models import OrderItem
from .services import to_pesos


def unit_cost(product):
    if product.total_cost_cop is None:
        return None
    return product.total_cost_cop + (product.local_shipping_cost or Decimal("0"))


def _pct(part, whole):
    if not whole:
        return None
    return float((part / whole * 100).quantize(Decimal("0.1")))


def _avg(total, count, places="0.1"):
    return float((Decimal(total) / count).quantize(Decimal(places))) if count else 0


class InsightsView(_RangeView):
    def build(self, request, start, end):
        days = (end - start).days + 1
        orders = list(
            sales_queryset(start, end)
            .select_related("coupon")
            .prefetch_related("items__product__franchise")
            .order_by("sold_at")
        )

        products = {}
        sold = defaultdict(lambda: {"unidades": 0, "ingresos": Decimal("0")})
        weekday = {d: {"dia": d, "pedidos": 0, "ingresos": Decimal("0")} for d in range(7)}
        hourly = {h: {"hora": h, "pedidos": 0, "ingresos": Decimal("0")} for h in range(24)}
        coupons = {key: {"pedidos": 0, "ingresos": Decimal("0"), "unidades": 0} for key in ("con", "sin")}
        by_customer = defaultdict(lambda: {"pedidos": 0, "ingresos": Decimal("0")})
        by_city = {}

        for order in orders:
            local = timezone.localtime(order.sold_at)
            net = order.subtotal - order.discount
            units = 0
            for item in order.items.all():
                products[item.product_id] = item.product
                line = sold[item.product_id]
                line["unidades"] += item.quantity
                line["ingresos"] += item.price * item.quantity
                units += item.quantity
            for bucket in (weekday[local.weekday()], hourly[local.hour]):
                bucket["pedidos"] += 1
                bucket["ingresos"] += net
            group = coupons["con" if order.coupon_id else "sin"]
            group["pedidos"] += 1
            group["ingresos"] += net
            group["unidades"] += units
            customer = by_customer[order.user_id]
            customer["pedidos"] += 1
            customer["ingresos"] += net
            city_name = " ".join(order.shipping_city.split()) or "Sin ciudad"
            city = by_city.setdefault(
                city_name.casefold(), {"spellings": Counter(), "pedidos": 0, "ingresos": Decimal("0")},
            )
            city["spellings"][city_name] += 1
            city["pedidos"] += 1
            city["ingresos"] += net

        margins, profit_total, revenue_with_cost = [], Decimal("0"), Decimal("0")
        for pid, line in sold.items():
            product = products[pid]
            cost = unit_cost(product)
            row = {
                "product_id": str(pid),
                "nombre": product.name,
                "franquicia": product.franchise.name,
                "unidades": line["unidades"],
                "ingresos": _money(line["ingresos"]),
                "costo": None,
                "utilidad": None,
                "margen_pct": None,
            }
            if cost is not None:
                total_cost = to_pesos(cost * line["unidades"])
                profit = line["ingresos"] - total_cost
                profit_total += profit
                revenue_with_cost += line["ingresos"]
                row.update(costo=_money(total_cost), utilidad=_money(profit), margen_pct=_pct(profit, line["ingresos"]))
            margins.append(row)
        margins.sort(key=lambda r: Decimal(r["utilidad"] or "-1e18"), reverse=True)

        franchises = defaultdict(lambda: {"ingresos": Decimal("0"), "unidades": 0, "productos_activos": 0})
        for name in Product.objects.filter(is_active=True).values_list("franchise__name", flat=True):
            franchises[name]["productos_activos"] += 1
        for pid, line in sold.items():
            entry = franchises[products[pid].franchise.name]
            entry["ingresos"] += line["ingresos"]
            entry["unidades"] += line["unidades"]

        recurring = [c for c in by_customer.values() if c["pedidos"] >= 2]
        thresholds = ShippingZone.objects.exclude(free_shipping_threshold=None).values_list(
            "free_shipping_threshold", flat=True,
        )

        return {
            "desde": start.isoformat(),
            "hasta": end.isoformat(),
            "dias": days,
            "margen_por_producto": margins,
            "utilidad_total": _money(profit_total),
            "margen_promedio_pct": _pct(profit_total, revenue_with_cost),
            "por_dia_semana": [{**d, "ingresos": _money(d["ingresos"])} for d in weekday.values()],
            "por_hora": [{**h, "ingresos": _money(h["ingresos"])} for h in hourly.values()],
            "subtotales": [_money(o.subtotal) for o in orders],
            "umbral_envio_gratis": _money(min(thresholds)) if thresholds else None,
            "cupones": {
                key: {
                    "pedidos": g["pedidos"],
                    "ticket_promedio": _money(to_pesos(g["ingresos"] / g["pedidos"])) if g["pedidos"] else _money(0),
                    "unidades_promedio": _avg(g["unidades"], g["pedidos"]),
                }
                for key, g in coupons.items()
            },
            "clientes": {
                "total": len(by_customer),
                "recurrentes": len(recurring),
                "ingresos_recurrentes": _money(sum((c["ingresos"] for c in recurring), Decimal("0"))),
            },
            "por_ciudad": sorted(
                (
                    {
                        "ciudad": c["spellings"].most_common(1)[0][0],
                        "pedidos": c["pedidos"],
                        "ingresos": _money(c["ingresos"]),
                        "ticket_promedio": _money(to_pesos(c["ingresos"] / c["pedidos"])),
                    }
                    for c in by_city.values()
                ),
                key=lambda c: Decimal(c["ingresos"]),
                reverse=True,
            ),
            "por_franquicia": sorted(
                (
                    {"franquicia": name, "ingresos": _money(f["ingresos"]), "unidades": f["unidades"],
                     "productos_activos": f["productos_activos"]}
                    for name, f in franchises.items()
                ),
                key=lambda f: (Decimal(f["ingresos"]), f["productos_activos"]),
                reverse=True,
            ),
            "inventario_dormido": self._dormant(sold, end),
            "cobertura": sorted(
                (
                    {
                        "product_id": str(pid),
                        "nombre": products[pid].name,
                        "stock": products[pid].stock,
                        "unidades_por_dia": round(line["unidades"] / days, 2),
                        "dias_cobertura": int(products[pid].stock * days / line["unidades"]),
                    }
                    for pid, line in sold.items()
                ),
                key=lambda r: r["dias_cobertura"],
            ),
        }

    def _dormant(self, sold, end):
        last_sale = dict(
            OrderItem.objects.filter(order__status__in=SALE_STATUSES)
            .values("product_id")
            .annotate(last=Max(Coalesce("order__paid_at", "order__created_at")))
            .values_list("product_id", "last")
        )
        rows = []
        for product in Product.objects.filter(is_active=True, stock__gt=0).exclude(pk__in=list(sold)):
            since = timezone.localtime(last_sale.get(product.pk, product.created_at)).date()
            cost = unit_cost(product)
            rows.append({
                "product_id": str(product.pk),
                "nombre": product.name,
                "stock": product.stock,
                "valor_precio": _money(product.base_price * product.stock),
                "valor_costo": _money(to_pesos(cost * product.stock)) if cost is not None else None,
                "dias_sin_venta": max((end - since).days, 0),
            })
        rows.sort(key=lambda r: Decimal(r["valor_precio"]), reverse=True)
        return rows
