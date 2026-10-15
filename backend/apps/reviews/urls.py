from django.urls import path

from .views import ReviewViewSet

urlpatterns = [
    path("reviews/", ReviewViewSet.as_view({"get": "list", "post": "create"}), name="review-list"),
    path("reviews/<uuid:pk>/", ReviewViewSet.as_view({"delete": "destroy"}), name="review-detail"),
]
