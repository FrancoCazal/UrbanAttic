from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.cart.services import CartService
from apps.cart.api.serializers import (
    AddToCartSerializer,
    CartDetailSerializer,
    UpdateCartItemSerializer,
)
from apps.products.models import ProductVariant


@extend_schema(tags=['Cart'])
class CartView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Get cart',
        description='Returns current cart contents with items, totals, and item count. Cart data is stored in Redis with a 7-day TTL.',
        responses={200: CartDetailSerializer},
    )
    def get(self, request):
        cart = CartService(request.user)
        data = cart.get_cart_detail(request=request)
        serializer = CartDetailSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Cart'])
class CartAddView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Add item to cart', request=AddToCartSerializer)
    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant_id = serializer.validated_data['variant_id']
        quantity = serializer.validated_data['quantity']

        if not ProductVariant.objects.filter(id=variant_id, is_active=True).exists():
            return Response(
                {'detail': 'Variant not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart = CartService(request.user)
        new_qty = cart.add(variant_id, quantity)
        return Response({'variant_id': variant_id, 'quantity': new_qty})


@extend_schema(tags=['Cart'])
class CartUpdateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Update item quantity', request=UpdateCartItemSerializer, responses={200: CartDetailSerializer})
    def patch(self, request, variant_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService(request.user)
        cart.update(variant_id, serializer.validated_data['quantity'])

        data = cart.get_cart_detail(request=request)
        return Response(CartDetailSerializer(data).data)


@extend_schema(tags=['Cart'])
class CartRemoveView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Remove item from cart', responses={204: None})
    def delete(self, request, variant_id):
        cart = CartService(request.user)
        cart.remove(variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Cart'])
class CartClearView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Clear entire cart', responses={204: None})
    def delete(self, request):
        cart = CartService(request.user)
        cart.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)
