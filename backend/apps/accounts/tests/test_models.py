import pytest
from decimal import Decimal
from django.db import IntegrityError

from apps.accounts.models import CustomUser, WishlistItem
from apps.products.models import Category, Franchise, Brand, Product


@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="friki@test.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def category(db):
    return Category.objects.create(name="Figuras de Accion")


@pytest.fixture
def franchise(db):
    return Franchise.objects.create(name="Dragon Ball")


@pytest.fixture
def brand(db):
    return Brand.objects.create(name="Bandai")


@pytest.fixture
def product(db, category, franchise, brand):
    return Product.objects.create(
        name="Goku SSJ",
        category=category,
        franchise=franchise,
        brand=brand,
        sku="GOKU-001",
        base_price=Decimal("150000.00"),
        stock=10,
    )


class TestCustomUser:
    def test_create_user_with_email(self, db):
        user = CustomUser.objects.create_user(
            email="nuevo@test.com",
            password="testpass123",
            first_name="Nuevo",
            last_name="Usuario",
        )
        assert user.email == "nuevo@test.com"
        assert user.check_password("testpass123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_create_superuser(self, db):
        admin = CustomUser.objects.create_superuser(
            email="admin@test.com",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
        )
        assert admin.is_staff is True
        assert admin.is_superuser is True

    def test_email_uniqueness(self, user):
        with pytest.raises(IntegrityError):
            CustomUser.objects.create_user(
                email="friki@test.com",
                password="otropass123",
                first_name="Otro",
                last_name="User",
            )

    def test_str_returns_email(self, user):
        assert str(user) == "friki@test.com"


class TestWishlistItem:
    def test_add_to_wishlist(self, user, product):
        item = WishlistItem.objects.create(user=user, product=product)
        assert item.user == user
        assert item.product == product
        assert item.created_at is not None

    def test_no_duplicate_wishlist(self, user, product):
        WishlistItem.objects.create(user=user, product=product)
        with pytest.raises(IntegrityError):
            WishlistItem.objects.create(user=user, product=product)
