from django.contrib import admin

from apps.imports.models import ImportLot
from apps.products.models import Product


class ProductInImportLotInline(admin.TabularInline):
    model = Product
    extra = 0
    fields = (
        "name", "sku", "cost_usd",
        "import_cost_per_unit", "total_cost_cop", "suggested_price", "base_price",
    )
    readonly_fields = (
        "name", "sku",
        "import_cost_per_unit", "total_cost_cop", "suggested_price",
    )
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ImportLot)
class ImportLotAdmin(admin.ModelAdmin):
    list_display = (
        "name", "date", "exchange_rate", "total_cost",
        "product_count", "cost_per_unit", "default_margin_pct",
    )
    readonly_fields = ("total_cost", "product_count", "cost_per_unit")
    inlines = [ProductInImportLotInline]
    fieldsets = (
        (None, {
            "fields": ("name", "date", "exchange_rate", "default_margin_pct"),
        }),
        ("Costos del Lote", {
            "fields": (
                "shipping_cost_usd", "customs_cost_cop", "other_costs_cop",
                "total_cost", "product_count", "cost_per_unit",
            ),
        }),
        ("Notas", {
            "fields": ("notes",),
        }),
    )
    actions = ["recalculate_costs"]

    @admin.action(description="Recalcular costos de los lotes seleccionados")
    def recalculate_costs(self, request, queryset):
        for lot in queryset:
            lot.save()
            for product in lot.products.all():
                product.save()
