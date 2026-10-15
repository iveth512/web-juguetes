from django.urls import path

from .dashboard import (
    AdminOrderDetailView,
    AdminOrderHistoryView,
    DashboardSummaryView,
    SalesByDayView,
    SalesByProductView,
)
from .insights import InsightsView
from .views import (
    CheckoutQuoteView,
    CheckoutView,
    CouponValidateView,
    OrderCancelView,
    OrderDetailView,
    OrderHistoryView,
)

urlpatterns = [
    path("coupons/validate/", CouponValidateView.as_view(), name="coupon-validate"),
    path("checkout/quote/", CheckoutQuoteView.as_view(), name="checkout-quote"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderHistoryView.as_view(), name="order-history"),
    path("orders/<uuid:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<uuid:pk>/cancel/", OrderCancelView.as_view(), name="order-cancel"),
    # Admin dashboard
    path("admin/dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("admin/dashboard/sales-by-day/", SalesByDayView.as_view(), name="dashboard-sales-by-day"),
    path("admin/dashboard/sales-by-product/", SalesByProductView.as_view(), name="dashboard-sales-by-product"),
    path("admin/dashboard/insights/", InsightsView.as_view(), name="dashboard-insights"),
    path("admin/orders/", AdminOrderHistoryView.as_view(), name="admin-order-history"),
    path("admin/orders/<uuid:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
]
