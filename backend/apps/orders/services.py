import stripe
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError
from apps.cart.services import CartService
from apps.orders.models import Order, OrderItem
from apps.products.models import ProductVariant


class CheckoutService:
    def __init__(self, user):
        self.user = user
        self.cart_service = CartService(user)

    def create_order(self, shipping_address='', notes=''):
        cart_items = self.cart_service.get_items()
        if not cart_items:
            raise ValidationError({'detail': 'Cart is empty.'})

        variant_ids = [item['variant_id'] for item in cart_items]

        with transaction.atomic():
            variants = ProductVariant.objects.filter(
                id__in=variant_ids, is_active=True,
            ).select_for_update().select_related('product').in_bulk()

            order_items_data = []
            total = Decimal('0.00')

            for item in cart_items:
                variant = variants.get(item['variant_id'])
                if variant is None:
                    raise ValidationError({
                        'detail': f'Variant with id {item["variant_id"]} is not available.'
                    })
                if variant.stock < item['quantity']:
                    raise ValidationError({
                        'detail': f'Insufficient stock for "{variant}". '
                                  f'Available: {variant.stock}, requested: {item["quantity"]}.'
                    })
                line_total = variant.price * item['quantity']
                total += line_total
                order_items_data.append({
                    'variant': variant,
                    'quantity': item['quantity'],
                    'price': variant.price,
                })

            order = Order.objects.create(
                user=self.user,
                total_amount=total,
                shipping_address=shipping_address,
                notes=notes,
            )

            order_items = []
            for data in order_items_data:
                order_items.append(OrderItem(
                    order=order,
                    variant=data['variant'],
                    quantity=data['quantity'],
                    price=data['price'],
                ))
                ProductVariant.objects.filter(pk=data['variant'].pk).update(
                    stock=F('stock') - data['quantity']
                )

            OrderItem.objects.bulk_create(order_items)

        self.cart_service.clear()
        return order


class StripeCheckoutService:
    @staticmethod
    def create_checkout_session(order):
        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = []
        for item in order.items.select_related('variant__product').all():
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(item.price * 100),
                    'product_data': {
                        'name': f'{item.variant.product.name} - {item.variant.name}',
                    },
                },
                'quantity': item.quantity,
            })

        session = stripe.checkout.Session.create(
            line_items=line_items,
            mode='payment',
            success_url=(
                f"{settings.FRONTEND_URL}/checkout/success"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=f"{settings.FRONTEND_URL}/checkout/cancel?order_id={order.pk}",
            metadata={'order_id': str(order.pk)},
            client_reference_id=str(order.pk),
        )

        order.stripe_checkout_session_id = session.id
        order.save(update_fields=['stripe_checkout_session_id'])

        return session.url
