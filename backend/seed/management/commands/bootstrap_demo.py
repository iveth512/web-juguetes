"""Prepare a local demo: catalog with photos, demo users and sales.

Safe to run on every start: each step only fills what is missing.
"""
import io
import random
import textwrap
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from apps.accounts.models import CustomUser
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.products.models import Product, ProductImage
from apps.shipping.services import shipping_cost_for

ADMIN = {"email": "admin@demo.local", "password": "Admin-Demo-2026!", "first_name": "Admin", "last_name": "Demo"}
CLIENT = {"email": "cliente@demo.local", "password": "Cliente-Demo-2026!", "first_name": "Cliente", "last_name": "Demo"}
OTHER_CUSTOMERS = [
    ("laura@demo.local", "Laura", "Rios", "Bogota"),
    ("andres@demo.local", "Andres", "Mejia", "Medellin"),
    ("sofia@demo.local", "Sofia", "Perez", "Cali"),
    ("camilo@demo.local", "Camilo", "Diaz", "Pasto"),
]
PALETTE = ["#2E1A6B", "#F57C20", "#1F7A6D", "#B23A48", "#3B5BA9", "#6B4E9B", "#8A6D1F"]


def _font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10.1
        return ImageFont.load_default()


def _placeholder(product):
    """A flat square with the product's name: enough to tell products apart."""
    color = PALETTE[sum(map(ord, product.category.name)) % len(PALETTE)]
    img = Image.new("RGB", (800, 800), color)
    draw = ImageDraw.Draw(img)
    draw.text((60, 60), product.franchise.name.upper(), font=_font(34), fill="#E6E6F0")
    y = 300
    for line in textwrap.wrap(product.name, width=18)[:4]:
        draw.text((60, y), line, font=_font(62), fill="#FFFFFF")
        y += 80
    draw.text((60, 700), "JuguetesParaFrikis", font=_font(30), fill="#E6E6F0")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return ContentFile(buf.getvalue())


class Command(BaseCommand):
    help = "Prepara la demo local: catalogo, imagenes, usuarios y ventas de ejemplo."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("bootstrap_demo es solo para el entorno local (DEBUG=True).")

        call_command("seed_products", stdout=io.StringIO())
        images = self._images()
        self._user(ADMIN, staff=True)
        client = self._user(CLIENT)
        sales = self._sales(client)

        self.stdout.write(self.style.SUCCESS(
            f"Demo lista: {Product.objects.count()} productos ({images} imagenes nuevas), "
            f"{sales} ventas de ejemplo nuevas.\n"
            f"  Administrador: {ADMIN['email']} / {ADMIN['password']}\n"
            f"  Cliente:       {CLIENT['email']} / {CLIENT['password']}"
        ))

    def _images(self):
        created = 0
        for product in Product.objects.filter(images__isnull=True).select_related("category", "franchise"):
            image = ProductImage(product=product, is_primary=True, display_order=0, alt_text=product.name)
            image.image.save(f"demo-{product.slug}.png", _placeholder(product), save=True)
            created += 1
        return created

    def _user(self, data, staff=False):
        user, created = CustomUser.objects.get_or_create(
            email=data["email"],
            defaults={"first_name": data["first_name"], "last_name": data["last_name"]},
        )
        if created:  # never reset a password someone changed
            user.set_password(data["password"])
            user.is_staff = user.is_superuser = staff
            user.save()
        return user

    def _sales(self, client):
        if Order.objects.filter(user__email__endswith="@demo.local").exists():
            return 0

        rng = random.Random(2026)  # same demo data on every machine
        customers = [(client, "Bogota")]
        for email, first, last, city in OTHER_CUSTOMERS:
            user, _ = CustomUser.objects.get_or_create(email=email, defaults={"first_name": first, "last_name": last})
            customers.append((user, city))

        products = list(Product.objects.filter(is_active=True, has_variants=False).order_by("sku")[:16])
        if not products:
            return 0

        now = timezone.now()
        count = 0
        for days_ago in range(30):
            for _ in range(rng.choice([0, 1, 1, 2, 2, 3])):
                user, city = rng.choice(customers)
                lines = [(p, rng.choice([1, 1, 2])) for p in rng.sample(products, rng.choice([1, 1, 2]))]
                subtotal = sum(p.base_price * qty for p, qty in lines)
                shipping = shipping_cost_for(city, subtotal)
                when = now - timedelta(days=days_ago, hours=rng.randint(0, 10), minutes=rng.randint(0, 59))
                if days_ago > 6:
                    status = rng.choice([Order.Status.DELIVERED, Order.Status.DELIVERED, Order.Status.SHIPPED])
                elif days_ago > 2:
                    status = rng.choice([Order.Status.SHIPPED, Order.Status.PAID])
                else:
                    status = Order.Status.PAID

                order = Order.objects.create(
                    user=user, status=status, subtotal=subtotal, shipping_cost=shipping,
                    total=subtotal + shipping, shipping_name=user.get_full_name(),
                    shipping_phone="3001234567", shipping_address="Calle de ejemplo 123",
                    shipping_city=city, shipping_department="Colombia", paid_at=when,
                    shipped_at=when + timedelta(days=1) if status != Order.Status.PAID else None,
                )
                Order.objects.filter(pk=order.pk).update(created_at=when)
                for product, qty in lines:
                    OrderItem.objects.create(order=order, product=product, quantity=qty, price=product.base_price)
                Payment.objects.create(
                    order=order, provider=Payment.Provider.SIMULATED,
                    reference=f"DEMO-{order.short_id}-{count}", amount=order.total,
                    status=Payment.Status.APPROVED, payment_method="CARD",
                )
                count += 1
        return count
