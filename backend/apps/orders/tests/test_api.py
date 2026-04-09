import pytest
from decimal import Decimal
from unittest.mock import patch
from apps.orders.models import Order, OrderItem
from apps.products.models import ProductVariant
from apps.products.tests.factories import ProductVariantFactory


@pytest.mark.django_db
class TestOrderList:
    url = '/api/v1/orders/'

    def test_unauthenticated_access(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_list_own_orders(self, auth_client, user):
        order = Order.objects.create(
            user=user, total_amount=Decimal('50.00'),
        )
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_cannot_see_other_users_orders(self, auth_client, admin_user):
        Order.objects.create(
            user=admin_user, total_amount=Decimal('50.00'),
        )
        response = auth_client.get(self.url)
        assert response.data['count'] == 0


@pytest.mark.django_db
class TestOrderCreate:
    url = '/api/v1/orders/'

    @patch('apps.orders.api.views.StripeCheckoutService.create_checkout_session', return_value='https://checkout.stripe.com/test')
    @patch('apps.orders.services.CartService')
    def test_create_order_from_cart(self, MockCartService, mock_stripe, auth_client, user):
        variant = ProductVariantFactory(price=Decimal('25.00'), stock=10)

        mock_cart = MockCartService.return_value
        mock_cart.get_items.return_value = [
            {'variant_id': variant.id, 'quantity': 2},
        ]
        mock_cart.clear.return_value = None

        response = auth_client.post(self.url, {
            'shipping_address': '123 Main St',
        })
        assert response.status_code == 201
        assert response.data['total_amount'] == '50.00'
        assert response.data['status'] == 'pending'
        assert response.data['checkout_url'] == 'https://checkout.stripe.com/test'
        mock_stripe.assert_called_once()
        mock_cart.clear.assert_called_once()

        variant.refresh_from_db()
        assert variant.stock == 8


@pytest.mark.django_db
class TestOrderCancel:
    def test_cancel_pending_order(self, auth_client, user):
        variant = ProductVariantFactory(stock=8)
        order = Order.objects.create(
            user=user, total_amount=Decimal('50.00'),
            status=Order.Status.PENDING,
        )
        OrderItem.objects.create(
            order=order, variant=variant, quantity=2,
            price=Decimal('25.00'),
        )

        response = auth_client.post(f'/api/v1/orders/{order.pk}/cancel/')
        assert response.status_code == 200
        assert response.data['status'] == 'cancelled'

        variant.refresh_from_db()
        assert variant.stock == 10  # restored

    def test_cannot_cancel_shipped_order(self, auth_client, user):
        order = Order.objects.create(
            user=user, total_amount=Decimal('50.00'),
            status=Order.Status.SHIPPED,
        )
        response = auth_client.post(f'/api/v1/orders/{order.pk}/cancel/')
        assert response.status_code == 400

    def test_cannot_cancel_other_users_order(self, auth_client, admin_user):
        order = Order.objects.create(
            user=admin_user, total_amount=Decimal('50.00'),
            status=Order.Status.PENDING,
        )
        response = auth_client.post(f'/api/v1/orders/{order.pk}/cancel/')
        assert response.status_code == 404
