from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter
from apps.products.models import Category, Product, ProductVariant
from apps.products.api.serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = (AllowAny,)
    search_fields = ('name',)


class CategoryTreeView(generics.ListAPIView):
    """Returns categories as a nested tree starting from root nodes."""
    serializer_class = CategoryTreeSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Category.objects.filter(parent__isnull=True, is_active=True)


class ProductFilter(FilterSet):
    min_price = NumberFilter(method='filter_min_price')
    max_price = NumberFilter(method='filter_max_price')
    category = CharFilter(method='filter_category')

    class Meta:
        model = Product
        fields = ('category', 'min_price', 'max_price')

    def filter_category(self, queryset, name, value):
        """Filter by category slug, including all descendant categories."""
        try:
            category = Category.objects.get(slug=value, is_active=True)
        except Category.DoesNotExist:
            return queryset.none()
        descendant_ids = [c.id for c in category.get_descendants()]
        all_ids = [category.id] + descendant_ids
        return queryset.filter(category_id__in=all_ids)

    def filter_min_price(self, queryset, name, value):
        """Filter products that have at least one variant with price >= value."""
        variant_product_ids = ProductVariant.objects.filter(
            price__gte=value, is_active=True,
        ).values_list('product_id', flat=True)
        return queryset.filter(id__in=variant_product_ids)

    def filter_max_price(self, queryset, name, value):
        """Filter products that have at least one variant with price <= value."""
        variant_product_ids = ProductVariant.objects.filter(
            price__lte=value, is_active=True,
        ).values_list('product_id', flat=True)
        return queryset.filter(id__in=variant_product_ids)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').filter(is_active=True)
    filterset_class = ProductFilter
    search_fields = ('name', 'description')
    ordering_fields = ('created_at', 'name')
    ordering = ('-created_at',)
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])
