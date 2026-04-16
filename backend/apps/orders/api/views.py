import stripe
from django.conf import settings
from rest_framework import generics, serializers as drf_serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import F
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
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


_checkout_response = inline_serializer('CheckoutResponse', fields={
    'id': drf_serializers.IntegerField(),
    'status': drf_serializers.CharField(),
    'total_amount': drf_serializers.DecimalField(max_digits=10, decimal_places=2),
    'checkout_url': drf_serializers.URLField(),
})


@extend_schema_view(
    get=extend_schema(tags=['Orders'], summary='List orders', description="Returns the authenticated user's orders sorted by most recent."),
    post=extend_schema(
        tags=['Orders'],
        summary='Create order from cart',
        description='Converts the current cart into an order, creates a Stripe Checkout session, and returns the checkout URL. Cart is cleared on success.',
        responses={201: _checkout_response},
    ),
)
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


@extend_schema(tags=['Orders'], summary='Order detail', description='Returns full order details including line items, payment status, and timestamps.')
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = (IsAuthenticated, IsOwner)

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user,
        ).prefetch_related('items__variant__product')


@extend_schema(tags=['Orders'])
class OrderCancelView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Cancel order',
        description='Cancel a pending order and return stock to inventory. Only orders with status "pending" can be cancelled.',
        request=None,
        responses={200: OrderDetailSerializer},
    )
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


@extend_schema(tags=['Orders'])
class CreateCheckoutSessionView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary='Retry payment',
        description='Create a new Stripe Checkout session for a pending order. Use this when the previous checkout session expired.',
        request=None,
        responses={200: inline_serializer('CheckoutURLResponse', fields={
            'checkout_url': drf_serializers.URLField(),
        })},
    )
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


@extend_schema(tags=['Orders'])
class StripeWebhookView(APIView):
    permission_classes = ()
    authentication_classes = ()

    @extend_schema(
        summary='Stripe webhook',
        description=(
            'Handles Stripe webhook events. Verifies the event signature using '
            'the webhook secret. On `checkout.session.completed`, updates the '
            'order status to processing and triggers a confirmation email via Celery. '
            'Idempotent: duplicate events for already-processed orders are ignored.'
        ),
        request=None,
        responses={200: inline_serializer('WebhookOK', fields={
            'status': drf_serializers.CharField(default='ok'),
        })},
    )
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

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

        return Response({'status': 'ok'})
