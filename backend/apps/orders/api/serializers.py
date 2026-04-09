from rest_framework import serializers
from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    sku = serializers.CharField(source='variant.sku', read_only=True)
    line_total = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = ('id', 'variant', 'product_name', 'variant_name', 'sku', 'quantity', 'price', 'line_total')
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'status', 'total_amount', 'items_count', 'created_at')


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'total_amount', 'shipping_address', 'notes', 'items',
            'payment_status', 'created_at', 'updated_at',
        )

    def get_payment_status(self, obj):
        if obj.status in (Order.Status.PROCESSING, Order.Status.SHIPPED, Order.Status.DELIVERED):
            return 'paid'
        if obj.status == Order.Status.CANCELLED:
            return 'cancelled'
        return 'pending'


class OrderCreateSerializer(serializers.Serializer):
    """Input for checkout. Order is created from the user's cart."""
    shipping_address = serializers.CharField(
        required=False, allow_blank=True, default='',
        help_text='Optional shipping address.',
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, default='',
        help_text='Optional order notes.',
    )
