from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewListSerializer


class ReviewViewSet(viewsets.ViewSet):

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request):
        product_slug = request.query_params.get("product")
        queryset = Review.objects.select_related("user")
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        serializer = ReviewListSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ReviewCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        review = Review.objects.filter(pk=pk, user=request.user).first()
        if not review:
            return Response(status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
