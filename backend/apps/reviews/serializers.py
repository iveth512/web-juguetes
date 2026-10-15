from rest_framework import serializers

from .models import Review
from apps.orders.models import OrderItem


class ReviewListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.first_name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user_name",
            "rating",
            "title",
            "comment",
            "is_verified_purchase",
            "created_at",
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Review
        fields = ["product_id", "rating", "title", "comment"]

    def validate(self, attrs):
        user = self.context["request"].user
        product_id = attrs["product_id"]

        if Review.objects.filter(user=user, product_id=product_id).exists():
            raise serializers.ValidationError(
                "Ya dejaste una resena para este producto"
            )

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        product_id = validated_data.pop("product_id")

        is_verified = OrderItem.objects.filter(
            order__user=user,
            product_id=product_id,
            order__status__in=["paid", "shipped", "delivered"],
        ).exists()

        review = Review.objects.create(
            user=user,
            product_id=product_id,
            is_verified_purchase=is_verified,
            **validated_data,
        )
        return review
