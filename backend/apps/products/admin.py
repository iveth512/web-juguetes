from django.contrib import admin

from .models import Brand, Category, Franchise, Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "is_primary", "display_order")


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = (
        "name", "sku", "price", "compare_price", "stock",
        "is_active", "display_order", "cost_usd", "exchange_rate", "import_cost_cop",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "sku", "category", "franchise", "base_price",
        "stock", "is_active", "is_new", "is_on_sale", "updated_at",
    )
    list_filter = (
        "category", "franchise", "brand",
        "is_active", "is_new", "is_on_sale", "is_featured",
    )
    search_fields = ("name", "sku", "description")
    list_editable = ("is_active", "is_new", "is_on_sale")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = (
        "import_cost_per_unit", "total_cost_cop",
        "suggested_price", "gross_margin", "margin_percentage",
    )
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        ("Informacion Basica", {
            "fields": (
                "name", "slug", "description", "short_description",
                "category", "franchise", "brand", "sku",
            ),
        }),
        ("Precios y Stock", {
            "fields": (
                "base_price", "compare_price", "stock",
                "low_stock_threshold", "has_variants",
            ),
        }),
        ("Costos Internos", {
            "classes": ("collapse",),
            "fields": (
                "cost_usd", "import_lot", "profit_margin_pct",
                "local_shipping_cost", "import_cost_per_unit",
                "total_cost_cop", "suggested_price", "gross_margin", "margin_percentage",
            ),
        }),
        ("Visibilidad", {
            "fields": (
                "is_active", "is_featured", "is_new", "is_on_sale", "sale_percentage",
            ),
        }),
        ("SEO y Metadata", {
            "classes": ("collapse",),
            "fields": ("meta_title", "meta_description", "tags"),
        }),
        ("Dimensiones", {
            "classes": ("collapse",),
            "fields": ("weight_grams", "dimensions"),
        }),
    )
    actions = ["make_active", "make_inactive", "mark_as_new", "mark_as_on_sale"]

    @admin.action(description="Activar productos seleccionados")
    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Desactivar productos seleccionados")
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description="Marcar como nuevo los productos seleccionados")
    def mark_as_new(self, request, queryset):
        queryset.update(is_new=True)

    @admin.action(description="Marcar como en oferta los productos seleccionados")
    def mark_as_on_sale(self, request, queryset):
        queryset.update(is_on_sale=True)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "display_order", "is_active")
    list_filter = ("is_active", "parent")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Franchise)
class FranchiseAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
