import json
import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import F
from apps.orders.models import Order
from apps.orders.permissions import IsOwner
from apps.orders.services import CheckoutService, StripeCheckoutService
from apps.orders.tasks import send_order_confirmation_email
from apps.orders.api.serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
)
from apps.products.models import ProductVariant


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = CheckoutService(request.user)
        order = service.create_order(
            shipping_address=serializer.validated_data.get('shipping_address', ''),
            notes=serializer.validated_data.get('notes', ''),
        )

        # Create Stripe Checkout Session and return URL
        checkout_url = StripeCheckoutService.create_checkout_session(order)

        output = OrderDetailSerializer(order)
        response_data = output.data
        response_data['checkout_url'] = checkout_url
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = (IsAuthenticated, IsOwner)

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user,
        ).prefetch_related('items__variant__product')


class OrderCancelView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status != Order.Status.PENDING:
            return Response(
                {'detail': f'Cannot cancel order with status "{order.get_status_display()}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status', 'updated_at'])

        for item in order.items.select_related('variant').all():
            ProductVariant.objects.filter(pk=item.variant_id).update(
                stock=F('stock') + item.quantity
            )

        return Response(OrderDetailSerializer(order).data)


class CreateCheckoutSessionView(APIView):
    """Retry payment for a pending order."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(
                pk=pk, user=request.user, status=Order.Status.PENDING,
            )
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        checkout_url = StripeCheckoutService.create_checkout_session(order)
        return Response({'checkout_url': checkout_url})


@csrf_exempt
@require_POST
def stripe_webhook_view(request):
    """Handle Stripe webhook events. Plain Django view (no DRF auth/parsing)."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session.get('metadata', {}).get('order_id')

        if order_id:
            try:
                order = Order.objects.get(
                    pk=order_id, status=Order.Status.PENDING,
                )
                order.status = Order.Status.PROCESSING
                order.stripe_payment_intent_id = session.get('payment_intent', '')
                order.save(update_fields=[
                    'status', 'stripe_payment_intent_id', 'updated_at',
                ])
                send_order_confirmation_email.delay(order.pk)
            except Order.DoesNotExist:
                pass  # Already processed (idempotent) or doesn't exist

    return JsonResponse({'status': 'ok'})
