import django_filters

from apps.products.models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    franchise = django_filters.CharFilter(field_name="franchise__slug")
    brand = django_filters.CharFilter(field_name="brand__slug")
    min_price = django_filters.NumberFilter(
        field_name="base_price", lookup_expr="gte"
    )
    max_price = django_filters.NumberFilter(
        field_name="base_price", lookup_expr="lte"
    )
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    is_new = django_filters.BooleanFilter()
    is_on_sale = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Product
        fields = []

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset
