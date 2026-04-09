from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.services import CartService
from apps.cart.api.serializers import (
    AddToCartSerializer,
    CartDetailSerializer,
    UpdateCartItemSerializer,
)
from apps.products.models import ProductVariant


class CartView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        cart = CartService(request.user)
        data = cart.get_cart_detail(request=request)
        serializer = CartDetailSerializer(data)
        return Response(serializer.data)


class CartAddView(APIView):
    permission_classes = (IsAuthenticated,)

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


class CartUpdateView(APIView):
    permission_classes = (IsAuthenticated,)

    def patch(self, request, variant_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService(request.user)
        cart.update(variant_id, serializer.validated_data['quantity'])

        data = cart.get_cart_detail(request=request)
        return Response(CartDetailSerializer(data).data)


class CartRemoveView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, variant_id):
        cart = CartService(request.user)
        cart.remove(variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):
        cart = CartService(request.user)
        cart.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)
