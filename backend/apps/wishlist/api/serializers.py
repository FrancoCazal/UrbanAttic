from rest_framework import serializers
from apps.products.api.serializers import ProductListSerializer
from apps.wishlist.models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'created_at')
