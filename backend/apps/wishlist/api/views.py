from rest_framework import generics, serializers as drf_serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer
from apps.products.models import Product
from apps.wishlist.api.serializers import WishlistItemSerializer
from apps.wishlist.models import WishlistItem


@extend_schema(
    tags=['Wishlist'],
    summary='List wishlist items',
    description='Returns the authenticated user\'s wishlist items with product details.',
)
class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            WishlistItem.objects
            .filter(user=self.request.user)
            .select_related('product', 'product__category')
            .prefetch_related('product__images', 'product__variants')
        )


@extend_schema(
    tags=['Wishlist'],
    summary='Toggle product in wishlist',
    description='Adds the product to the wishlist if not present, removes it if present. Returns the final state.',
    request=None,
    responses={200: inline_serializer('WishlistToggleResponse', fields={
        'in_wishlist': drf_serializers.BooleanField(),
    })},
)
class WishlistToggleView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=product,
        )
        if not created:
            item.delete()
            return Response({'in_wishlist': False}, status=status.HTTP_200_OK)

        return Response({'in_wishlist': True}, status=status.HTTP_200_OK)
