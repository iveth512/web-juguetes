from django.urls import path

from .views import (
    BoldPaymentInitView,
    BoldWebhookView,
    PaymentInitView,
    PaymentSyncView,
    SimulatedPaymentView,
)

urlpatterns = [
    path("payments/init/<uuid:pk>/", PaymentInitView.as_view(), name="payment-init"),
    path("payments/bold/init/<uuid:pk>/", BoldPaymentInitView.as_view(), name="bold-payment-init"),
    path("payments/bold/webhook/", BoldWebhookView.as_view(), name="bold-webhook"),
    path("payments/simulado/<str:reference>/", SimulatedPaymentView.as_view(), name="simulated-payment"),
    path("payments/orders/<uuid:pk>/sync/", PaymentSyncView.as_view(), name="payment-sync"),
]
