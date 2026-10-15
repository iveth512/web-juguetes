import io
from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.orders.models import Order, OrderItem
from apps.products.models import Brand, Category, Franchise, Product, ProductImage


@pytest.fixture
def admin_client():
    admin = CustomUser.objects.create_superuser(
        email="admin@test.com", password="x", first_name="A", last_name="B",
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def deps():
    return (
        Category.objects.create(name="Figuras"),
        Franchise.objects.create(name="Marvel"),
        Brand.objects.create(name="Hasbro"),
    )


def _png(name="foto.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(buf, format="PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


def _form(deps, **extra):
    cat, fran, brand = deps
    data = {
        "name": "Iron Man", "sku": "IM-1", "base_price": "99000", "stock": "3",
        "category_id": str(cat.id), "franchise_id": str(fran.id), "brand_id": str(brand.id),
        "is_active": "true", "compare_price": "", "sale_percentage": "",
    }
    data.update(extra)
    return data


@pytest.mark.django_db
class TestAdminProductApi:
    def test_non_admin_is_forbidden(self, deps):
        user = CustomUser.objects.create_user(email="u@test.com", password="x", first_name="U", last_name="U")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post("/api/v1/admin/products/", _form(deps), format="multipart")
        assert resp.status_code == 403

    def test_category_defaults_to_the_only_one(self, admin_client, deps):
        data = _form(deps)
        del data["category_id"]
        resp = admin_client.post("/api/v1/admin/products/", data, format="multipart")
        assert resp.status_code == 201, resp.data
        assert resp.data["category_id"] == str(deps[0].id)

    def test_category_required_when_there_are_several(self, admin_client, deps):
        Category.objects.create(name="Peluches")
        data = _form(deps)
        del data["category_id"]
        resp = admin_client.post("/api/v1/admin/products/", data, format="multipart")
        assert resp.status_code == 400
        assert "category_id" in resp.data

    def test_creates_product_with_image(self, admin_client, deps):
        resp = admin_client.post(
            "/api/v1/admin/products/", {**_form(deps), "images": [_png()]}, format="multipart",
        )
        assert resp.status_code == 201, resp.data
        product = Product.objects.get(sku="IM-1")
        assert product.base_price == Decimal("99000")
        assert product.images.count() == 1

    def test_rejects_negative_price(self, admin_client, deps):
        resp = admin_client.post("/api/v1/admin/products/", _form(deps, base_price="-5"), format="multipart")
        assert resp.status_code == 400

    def test_rejects_fake_image(self, admin_client, deps):
        fake = SimpleUploadedFile("x.png", b"<?php echo 1; ?>", content_type="image/png")
        resp = admin_client.post(
            "/api/v1/admin/products/", {**_form(deps), "images": [fake]}, format="multipart",
        )
        assert resp.status_code == 400
        assert not Product.objects.filter(sku="IM-1").exists()

    def test_rejects_disallowed_type(self, admin_client, deps):
        svg = SimpleUploadedFile("x.svg", b"<svg/>", content_type="image/svg+xml")
        resp = admin_client.post(
            "/api/v1/admin/products/", {**_form(deps), "images": [svg]}, format="multipart",
        )
        assert resp.status_code == 400

    def test_delete_product_with_orders_deactivates_it(self, admin_client, deps):
        cat, fran, brand = deps
        product = Product.objects.create(
            name="P", sku="P-1", base_price=Decimal("1000"), category=cat, franchise=fran, brand=brand,
        )
        buyer = CustomUser.objects.create_user(email="b@test.com", password="x", first_name="B", last_name="B")
        order = Order.objects.create(user=buyer, total=Decimal("1000"))
        OrderItem.objects.create(order=order, product=product, quantity=1, price=Decimal("1000"))

        resp = admin_client.delete(f"/api/v1/admin/products/{product.id}/")

        assert resp.status_code == 200
        product.refresh_from_db()
        assert product.is_active is False


def _product(deps, **kwargs):
    cat, fran, brand = deps
    defaults = dict(
        name="Goku", sku=f"SKU-{Product.objects.count() + 1}", base_price=Decimal("50000"),
        stock=5, category=cat, franchise=fran, brand=brand,
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


@pytest.mark.django_db
class TestAdminProductList:
    def test_lists_inactive_products_too(self, admin_client, deps):
        _product(deps, name="Visible")
        _product(deps, name="Oculto", is_active=False)
        resp = admin_client.get("/api/v1/admin/products/")
        assert resp.status_code == 200
        assert {p["name"] for p in resp.data["results"]} == {"Visible", "Oculto"}

    def test_filters_and_search(self, admin_client, deps):
        _product(deps, name="Goku SSJ", sku="DBZ-1", stock=20)
        _product(deps, name="Vegeta", sku="DBZ-2", is_active=False)
        _product(deps, name="Pikachu", sku="PKM-1", stock=1)

        names = lambda r: [p["name"] for p in r.data["results"]]  # noqa: E731
        assert names(admin_client.get("/api/v1/admin/products/?q=goku")) == ["Goku SSJ"]
        assert names(admin_client.get("/api/v1/admin/products/?q=pkm")) == ["Pikachu"]
        assert names(admin_client.get("/api/v1/admin/products/?estado=inactivos")) == ["Vegeta"]
        assert names(admin_client.get("/api/v1/admin/products/?estado=bajo_stock")) == ["Pikachu"]

    def test_units_sold_counts_only_paid_orders(self, admin_client, deps):
        product = _product(deps)
        buyer = CustomUser.objects.create_user(email="c@test.com", password="x", first_name="C", last_name="C")
        paid = Order.objects.create(user=buyer, total=Decimal("1"), status=Order.Status.PAID)
        pending = Order.objects.create(user=buyer, total=Decimal("1"), status=Order.Status.PENDING)
        OrderItem.objects.create(order=paid, product=product, quantity=3, price=Decimal("1"))
        OrderItem.objects.create(order=pending, product=product, quantity=7, price=Decimal("1"))

        resp = admin_client.get("/api/v1/admin/products/")
        assert resp.data["results"][0]["units_sold"] == 3

    def test_non_admin_cannot_list(self, deps):
        user = CustomUser.objects.create_user(email="u@test.com", password="x", first_name="U", last_name="U")
        client = APIClient()
        client.force_authenticate(user=user)
        assert client.get("/api/v1/admin/products/").status_code == 403
        assert APIClient().get("/api/v1/admin/products/").status_code in (401, 403)


@pytest.mark.django_db
class TestAdminProductUpdate:
    def test_get_detail(self, admin_client, deps):
        product = _product(deps, name="Detalle")
        resp = admin_client.get(f"/api/v1/admin/products/{product.id}/")
        assert resp.status_code == 200
        assert resp.data["name"] == "Detalle"
        assert resp.data["category_id"] == str(deps[0].id)

    def test_partial_update(self, admin_client, deps):
        product = _product(deps, base_price=Decimal("50000"), stock=5)
        resp = admin_client.patch(
            f"/api/v1/admin/products/{product.id}/",
            {"base_price": "45000", "stock": "12", "is_featured": "true"}, format="multipart",
        )
        assert resp.status_code == 200, resp.data
        product.refresh_from_db()
        assert product.base_price == Decimal("45000")
        assert product.stock == 12
        assert product.is_featured is True
        assert product.name == "Goku"  # untouched

    def test_update_rejects_duplicate_sku(self, admin_client, deps):
        _product(deps, sku="TAKEN")
        product = _product(deps, sku="MINE")
        resp = admin_client.patch(f"/api/v1/admin/products/{product.id}/", {"sku": "taken"}, format="json")
        assert resp.status_code == 400
        assert "sku" in resp.data

    def test_update_keeps_own_sku(self, admin_client, deps):
        product = _product(deps, sku="MINE")
        resp = admin_client.patch(f"/api/v1/admin/products/{product.id}/", {"sku": "MINE", "name": "Nuevo"}, format="json")
        assert resp.status_code == 200

    def test_compare_price_must_exceed_base(self, admin_client, deps):
        product = _product(deps, base_price=Decimal("50000"))
        resp = admin_client.patch(f"/api/v1/admin/products/{product.id}/", {"compare_price": "40000"}, format="json")
        assert resp.status_code == 400
        assert "compare_price" in resp.data

    def test_turning_off_sale_clears_percentage(self, admin_client, deps):
        product = _product(deps, is_on_sale=True, sale_percentage=20)
        admin_client.patch(f"/api/v1/admin/products/{product.id}/", {"is_on_sale": False}, format="json")
        product.refresh_from_db()
        assert product.sale_percentage is None

    def test_images_add_remove_and_primary(self, admin_client, deps):
        product = _product(deps)
        first = ProductImage.objects.create(product=product, image=_png("a.png"), is_primary=True, display_order=0)
        second = ProductImage.objects.create(product=product, image=_png("b.png"), display_order=1)

        resp = admin_client.patch(
            f"/api/v1/admin/products/{product.id}/",
            {"remove_image_ids": [str(first.id)], "images": [_png("c.png")], "primary_image_id": str(second.id)},
            format="multipart",
        )
        assert resp.status_code == 200, resp.data
        images = {str(i["id"]): i for i in resp.data["images"]}
        assert str(first.id) not in images
        assert len(images) == 2
        assert images[str(second.id)]["is_primary"] is True
        assert sum(i["is_primary"] for i in images.values()) == 1

    def test_removing_primary_promotes_another(self, admin_client, deps):
        product = _product(deps)
        first = ProductImage.objects.create(product=product, image=_png("a.png"), is_primary=True, display_order=0)
        ProductImage.objects.create(product=product, image=_png("b.png"), display_order=1)
        resp = admin_client.patch(
            f"/api/v1/admin/products/{product.id}/", {"remove_image_ids": [str(first.id)]}, format="multipart",
        )
        assert [i["is_primary"] for i in resp.data["images"]] == [True]

    def test_update_unknown_product_is_404(self, admin_client):
        import uuid
        resp = admin_client.patch(f"/api/v1/admin/products/{uuid.uuid4()}/", {"name": "x"}, format="json")
        assert resp.status_code == 404

    def test_delete_without_orders_removes(self, admin_client, deps):
        product = _product(deps)
        assert admin_client.delete(f"/api/v1/admin/products/{product.id}/").status_code == 204
        assert not Product.objects.filter(pk=product.pk).exists()


@pytest.mark.django_db
class TestAdminProductFilters:
    def test_filters_by_franchise(self, admin_client, deps):
        cat, marvel, brand = deps
        dc = Franchise.objects.create(name="DC")
        Product.objects.create(name="Iron Man", sku="M-1", base_price=Decimal("1000"), category=cat, franchise=marvel, brand=brand)
        Product.objects.create(name="Batman", sku="D-1", base_price=Decimal("1000"), category=cat, franchise=dc, brand=brand)

        resp = admin_client.get("/api/v1/admin/products/", {"franquicia": str(dc.id)})

        assert resp.status_code == 200
        assert [p["name"] for p in resp.data["results"]] == ["Batman"]

    def test_invalid_franchise_id_is_a_400(self, admin_client):
        resp = admin_client.get("/api/v1/admin/products/", {"franquicia": "no-es-uuid"})
        assert resp.status_code == 400
