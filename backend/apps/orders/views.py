from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Coupon, Order
from .serializers import (
    CheckoutSerializer,
    CouponValidateSerializer,
    OrderSerializer,
    QuoteSerializer,
)
from .services import CheckoutError, build_quote, create_order, release_order, to_pesos


def _order_queryset(user):
    return Order.objects.filter(user=user).select_related("coupon").prefetch_related(
        "items__product__images"
    )


class CouponValidateView(APIView):
    throttle_scope = "coupon"

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].upper()
        subtotal = serializer.validated_data["subtotal"]

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {"detail": "Cupon no valido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid, message = coupon.is_valid(subtotal=subtotal)
        if not valid:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount_amount = to_pesos(coupon.calculate_discount(subtotal))
        return Response({
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": str(coupon.discount_value),
            "discount_amount": str(discount_amount),
        })


class CheckoutQuoteView(APIView):
    """Price a cart exactly as checkout will charge it (no reservation)."""

    def post(self, request):
        serializer = QuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            quote = build_quote(
                data["items"],
                city=data.get("shipping_city", ""),
                coupon_code=data.get("coupon_code", ""),
            )
        except CheckoutError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "subtotal": f"{quote.subtotal:.2f}",
            "discount": f"{quote.discount:.2f}",
            "shipping_cost": f"{quote.shipping_cost:.2f}",
            "total": f"{quote.total:.2f}",
            "coupon": quote.coupon.code if quote.coupon else None,
        })


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "checkout"

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = create_order(request.user, serializer.validated_data)
        except CheckoutError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        order = _order_queryset(request.user).get(pk=order.pk)
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = OrderSerializer(
            _order_queryset(request.user), many=True, context={"request": request}
        )
        return Response(serializer.data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = _order_queryset(request.user).filter(pk=pk).first()
        if order is None:
            return Response(
                {"detail": "Pedido no encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            OrderSerializer(order, context={"request": request}).data
        )


class OrderCancelView(APIView):
    """Let a customer cancel their own unpaid order, freeing its stock."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk, user=request.user).first()
        if order is None:
            return Response({"detail": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        if not release_order(order, reason="cancelado por el cliente"):
            return Response(
                {"detail": "Solo se pueden cancelar pedidos pendientes de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = _order_queryset(request.user).get(pk=pk)
        return Response(OrderSerializer(order, context={"request": request}).data)
