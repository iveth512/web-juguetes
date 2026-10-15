"""Prepare a local demo: catalog with photos, demo users and sales.

Safe to run on every start: each step only fills what is missing.
`--reset-sales` wipes demo and QA orders (qa.*@example.com accounts too)
and generates the 90 days of sales again.
"""
import io
import random
import textwrap
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from apps.accounts.models import CustomUser
from apps.orders.models import Coupon, Order, OrderItem
from apps.orders.services import release_order, to_pesos
from apps.payments.models import Payment
from apps.products.models import Product, ProductImage
from apps.shipping.services import shipping_cost_for

ADMIN = {"email": "admin@demo.local", "password": "Admin-Demo-2026!", "first_name": "Admin", "last_name": "Demo"}
CLIENT = {"email": "cliente@demo.local", "password": "Cliente-Demo-2026!", "first_name": "Cliente", "last_name": "Demo"}
FIRST_NAMES = [
    "Laura", "Andrés", "Sofía", "Camilo", "Valentina", "Santiago", "Mariana", "Juan", "Daniela", "Sebastián",
    "Isabella", "Mateo", "Gabriela", "Nicolás", "Paula", "Felipe", "Catalina", "Julián", "Natalia", "Tomás",
    "Manuela", "David", "Luisa", "Alejandro", "Carolina", "Esteban", "Juliana", "Miguel", "Sara", "Simón",
]
LAST_NAMES = [
    "Ríos", "Mejía", "Pérez", "Díaz", "Gómez", "Restrepo", "Torres", "Vargas", "Castro", "Moreno",
    "Ospina", "Cárdenas", "Rojas", "Herrera", "Salazar", "Muñoz", "Londoño", "Quintero", "Arango", "Suárez",
]
# (city, weight): most orders come from the big cities.
CITIES = [
    ("Bogotá", 38), ("Medellín", 18), ("Cali", 11), ("Barranquilla", 7), ("Bucaramanga", 6),
    ("Pereira", 5), ("Cartagena", 5), ("Manizales", 4), ("Pasto", 3), ("Villavicencio", 3),
]
DEMO_CUSTOMERS = 55
SALES_DAYS = 90
# Shoppers browse after work: evenings weigh most; weekends a bit more than weekdays.
HOUR_WEIGHTS = {h: 1 for h in range(8, 24)} | {12: 2, 13: 2, 18: 2, 19: 4, 20: 5, 21: 5, 22: 3, 23: 2}
WEEKDAY_WEIGHTS = [1.0, 0.9, 1.0, 1.0, 1.2, 1.5, 1.4]
NEVER_SOLD = 10  # products left without sales so the dormant-stock analysis has data
QA_EMAIL_REGEX = r"^qa\..*@example\.com$"
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

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-sales", action="store_true",
            help="Borra pedidos de demo y de QA (y las cuentas qa.*@example.com) y regenera las ventas.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("bootstrap_demo es solo para el entorno local (DEBUG=True).")

        call_command("seed_products", stdout=io.StringIO())
        if options["reset_sales"]:
            orders, users = self._reset_sales()
            self.stdout.write(f"Eliminados {orders} pedidos y {users} cuentas de prueba.")
        images = self._images()
        self._user(ADMIN, staff=True)
        client = self._user(CLIENT)
        sales = self._sales(client)

        self.stdout.write(self.style.SUCCESS(
            f"Demo lista: {Product.objects.count()} productos ({images} imágenes nuevas), "
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

    def _reset_sales(self):
        """Remove demo and QA orders (giving back stock of pending ones) and QA accounts."""
        qa_users = CustomUser.objects.filter(email__regex=QA_EMAIL_REGEX)
        orders = Order.objects.filter(Q(user__email__endswith="@demo.local") | Q(user__in=qa_users))
        for order in orders.filter(status=Order.Status.PENDING):
            release_order(order, reason="Datos de demostración regenerados")
        Payment.objects.filter(order__in=orders).delete()
        removed = orders.count()
        orders.delete()
        users = qa_users.count()
        qa_users.delete()
        # Demo shoppers are recreated with the sales; keep only the documented accounts.
        CustomUser.objects.filter(email__endswith="@demo.local").exclude(
            email__in=[ADMIN["email"], CLIENT["email"]],
        ).delete()
        return removed, users

    def _sales(self, client):
        if Order.objects.filter(user__email__endswith="@demo.local").exists():
            return 0

        rng = random.Random(2026)  # same demo data on every machine
        products = list(Product.objects.filter(is_active=True, has_variants=False).order_by("sku"))
        if not products:
            return 0
        sellable = sorted(rng.sample(products, len(products) - NEVER_SOLD), key=lambda p: p.sku)
        popularity = [rng.choice([1, 1, 2, 3, 5, 8]) for _ in sellable]
        coupons = list(Coupon.objects.filter(is_active=True))

        customers = [(client, "Bogotá")]
        cities, city_weights = zip(*CITIES)
        for n in range(DEMO_CUSTOMERS):
            first, last = FIRST_NAMES[n % len(FIRST_NAMES)], LAST_NAMES[(n * 7) % len(LAST_NAMES)]
            user, _ = CustomUser.objects.get_or_create(
                email=f"cliente{n + 1:02d}@demo.local", defaults={"first_name": first, "last_name": last},
            )
            customers.append((user, rng.choices(cities, city_weights)[0]))

        now = timezone.localtime()
        days = [now.date() - timedelta(days=d) for d in range(SALES_DAYS)]
        day_weights = [WEEKDAY_WEIGHTS[d.weekday()] for d in days]
        hours, hour_weights = zip(*HOUR_WEIGHTS.items())

        count = 0
        for user, city in customers:
            # Most customers buy once; about one in five comes back for 2 or 3 orders.
            for _ in range(rng.choices([1, 2, 3], [80, 13, 7])[0]):
                day = rng.choices(days, day_weights)[0]
                when = timezone.make_aware(
                    datetime.combine(day, time(rng.choices(hours, hour_weights)[0], rng.randint(0, 59))),
                )
                if when > now:
                    when -= timedelta(days=1)
                self._create_sale(rng, user, city, when, now, sellable, popularity, coupons, count)
                count += 1

        for coupon in coupons:
            Coupon.objects.filter(pk=coupon.pk).update(times_used=coupon.orders.count())
        return count

    def _create_sale(self, rng, user, city, when, now, products, weights, coupons, n):
        picks = []
        for _ in range(rng.choices([1, 2, 3], [65, 27, 8])[0]):
            product = rng.choices(products, weights)[0]
            if product not in picks:
                picks.append(product)
        lines = [(p, rng.choices([1, 2], [85, 15])[0]) for p in picks]
        subtotal = sum(p.base_price * qty for p, qty in lines)

        coupon, discount = None, Decimal("0")
        if coupons and rng.random() < 0.2:
            candidate = rng.choice(coupons)
            if subtotal >= (candidate.min_purchase or 0):
                coupon, discount = candidate, to_pesos(candidate.calculate_discount(subtotal))
        shipping = to_pesos(shipping_cost_for(city, subtotal))

        age = (now - when).days
        if age > 6:
            status = rng.choices([Order.Status.DELIVERED, Order.Status.SHIPPED], [85, 15])[0]
        elif age > 1:
            status = rng.choice([Order.Status.SHIPPED, Order.Status.PAID])
        else:
            status = Order.Status.PAID

        order = Order.objects.create(
            user=user, status=status, subtotal=subtotal, discount=discount, coupon=coupon,
            shipping_cost=shipping, total=subtotal - discount + shipping,
            shipping_name=user.get_full_name(), shipping_phone="3001234567",
            shipping_address="Calle de ejemplo 123", shipping_city=city, shipping_department="Colombia",
            paid_at=when, shipped_at=when + timedelta(days=1) if status != Order.Status.PAID else None,
            tracking_number=f"DEMO{rng.randint(100000, 999999)}" if status != Order.Status.PAID else "",
        )
        Order.objects.filter(pk=order.pk).update(created_at=when - timedelta(minutes=rng.randint(2, 15)))
        for product, qty in lines:
            OrderItem.objects.create(order=order, product=product, quantity=qty, price=product.base_price)
        Payment.objects.create(
            order=order, provider=Payment.Provider.SIMULATED,
            reference=f"DEMO-{order.short_id}-{n}", amount=order.total,
            status=Payment.Status.APPROVED, payment_method=rng.choice(["CARD", "CARD", "PSE", "NEQUI"]),
        )
