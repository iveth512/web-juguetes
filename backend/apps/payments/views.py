import json
import logging

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.orders.services import order_expires_at, release_order
from core.permissions import IsCustomer

from . import bold
from .models import Payment
from .services import (
    apply_bold_notification,
    reconcile_payment,
    resolve_simulated_payment,
    start_bold_payment,
    start_payment,
)

logger = logging.getLogger(__name__)


class BoldPaymentInitView(APIView):
    """Create a payment attempt and return the config for BoldCheckout."""

    permission_classes = [IsCustomer]
    throttle_scope = "payment"

    def post(self, request, pk):
        if not bold.is_configured():
            return Response(
                {"detail": "Los pagos no estan disponibles en este momento."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        order = Order.objects.filter(pk=pk, user=request.user).first()
        if order is None:
            return Response({"detail": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "Este pedido ya no esta pendiente de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expires_at = order_expires_at(order)
        if expires_at <= timezone.now():
            release_order(order, reason="expirado al intentar pagar")
            return Response(
                {"detail": "El pedido expiro. Vuelve a agregar los productos al carrito."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = start_bold_payment(order)
        amount = str(int(payment.amount))
        full_name = order.shipping_name or request.user.get_full_name()

        config = {
            "orderId": payment.reference,
            "currency": payment.currency,
            "amount": amount,
            "apiKey": settings.BOLD_API_KEY,
            "integritySignature": bold.integrity_signature(
                payment.reference, amount, payment.currency,
            ),
            "description": f"Pedido #{order.short_id} - JuguetesParaFrikis",
            "expirationDate": str(int(expires_at.timestamp()) * 10**9),
            "customerData": json.dumps({
                "email": request.user.email,
                "fullName": full_name,
                "phone": order.shipping_phone,
                "dialCode": "+57",
            }),
        }
        # Bold rejects the whole checkout (error BTN-001) if these are not
        # https, so they are left out in local development.
        result_url = f"{settings.FRONTEND_URL}/pedido-confirmado/{order.id}"
        if result_url.startswith("https://"):
            config["redirectionUrl"] = result_url
            config["originUrl"] = result_url

        return Response(
            {"script_url": bold.SCRIPT_URL, "config": config},
            status=status.HTTP_201_CREATED,
        )


class BoldWebhookView(APIView):
    """Receives Bold notifications. Must answer 200 within 2 seconds."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("x-bold-signature", "")
        if not bold.verify_webhook_signature(raw_body, signature):
            logger.warning("Bold webhook with invalid signature rejected")
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        try:
            notification = json.loads(raw_body)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            apply_bold_notification(notification)
        except Exception:
            # A non-200 makes Bold retry later (15 min, 1 h, 4 h, ...).
            logger.exception("Error processing Bold notification %s", notification.get("id"))
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(status=status.HTTP_200_OK)


class PaymentSyncView(APIView):
    """Called by the result page: confirms the real status with Bold."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "payment_sync"

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk, user=request.user).first()
        if order is None:
            return Response({"detail": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if order.status == Order.Status.PENDING:
            pending = order.payments.filter(
                status=Payment.Status.PENDING, provider=Payment.Provider.BOLD,
            )[:3]
            for payment in pending:
                reconcile_payment(payment)

        order = (
            Order.objects.select_related("coupon")
            .prefetch_related("items__product__images")
            .get(pk=pk)
        )
        return Response(OrderSerializer(order, context={"request": request}).data)


def _simulated_enabled():
    return settings.PAYMENTS_PROVIDER == "simulado" and settings.DEBUG


class PaymentInitView(BoldPaymentInitView):
    """Start paying an order with the configured gateway.

    Bold answers with the config for its checkout; the local simulated
    gateway answers with the URL of its test page.
    """

    def post(self, request, pk):
        if not _simulated_enabled():
            response = super().post(request, pk)
            if response.status_code == status.HTTP_201_CREATED:
                response.data["provider"] = "bold"
            return response

        order = Order.objects.filter(pk=pk, user=request.user).first()
        if order is None:
            return Response({"detail": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "Este pedido ya no esta pendiente de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if order_expires_at(order) <= timezone.now():
            release_order(order, reason="expirado al intentar pagar")
            return Response(
                {"detail": "El pedido expiro. Vuelve a agregar los productos al carrito."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = start_payment(order, Payment.Provider.SIMULATED)
        return Response(
            {"provider": "simulado", "checkout_url": f"/pago-simulado/{payment.reference}"},
            status=status.HTTP_201_CREATED,
        )


class SimulatedPaymentView(APIView):
    """Local test gateway: GET shows the charge, POST approves or rejects it."""

    permission_classes = [IsAuthenticated]

    def _payment(self, request, reference):
        if not _simulated_enabled():
            return None
        return (
            Payment.objects.select_related("order")
            .filter(provider=Payment.Provider.SIMULATED, reference=reference, order__user=request.user)
            .first()
        )

    def get(self, request, reference):
        payment = self._payment(request, reference)
        if payment is None:
            return Response({"detail": "Pago no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        order = payment.order
        return Response({
            "reference": payment.reference,
            "status": payment.status,
            "amount": str(int(payment.amount)),
            "currency": payment.currency,
            "description": f"Pedido #{order.short_id} - JuguetesParaFrikis",
            "order_id": str(order.id),
            "order_status": order.status,
            "items": [
                {"nombre": i.product.name, "variante": i.variant_name, "cantidad": i.quantity, "precio": str(i.price)}
                for i in order.items.select_related("product")
            ],
        })

    def post(self, request, reference):
        payment = self._payment(request, reference)
        if payment is None:
            return Response({"detail": "Pago no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        result = request.data.get("resultado")
        if result not in ("aprobado", "rechazado"):
            return Response({"detail": "resultado debe ser 'aprobado' o 'rechazado'."}, status=status.HTTP_400_BAD_REQUEST)
        if payment.status != Payment.Status.PENDING:
            return Response({"detail": "Este pago ya fue procesado."}, status=status.HTTP_400_BAD_REQUEST)

        resolve_simulated_payment(payment, approved=(result == "aprobado"))
        payment.refresh_from_db()
        payment.order.refresh_from_db()
        return Response({
            "order_id": str(payment.order_id),
            "payment_status": payment.status,
            "order_status": payment.order.status,
        })
