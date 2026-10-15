from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.orders.models import Order
from apps.orders.services import pending_expiry_cutoff, release_order
from apps.payments.models import Payment
from apps.payments.services import reconcile_payment


class Command(BaseCommand):
    help = (
        "Concilia con Bold los pagos pendientes (por si se perdio un webhook) y "
        "cancela los pedidos sin pagar que ya expiraron, liberando su stock."
    )

    def handle(self, *args, **options):
        # 1. Payments older than a few minutes still pending: ask Bold.
        stale = Payment.objects.filter(
            status=Payment.Status.PENDING,
            provider=Payment.Provider.BOLD,
            order__status=Order.Status.PENDING,
            created_at__lte=timezone.now() - timedelta(minutes=5),
        ).select_related("order")
        reconciled = sum(1 for p in stale if reconcile_payment(p))

        # 2. Expired unpaid orders: release stock and coupon.
        released = 0
        for order in Order.objects.filter(
            status=Order.Status.PENDING, created_at__lte=pending_expiry_cutoff(),
        ):
            if release_order(order, reason="expirado sin pago"):
                released += 1

        self.stdout.write(f"Pagos conciliados: {reconciled}. Pedidos expirados: {released}.")
