import pytest
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.orders.services import CheckoutService
from apps.orders.models import Order, OrderItem
from apps.products.tests.factories import ProductVariantFactory


class FakeCartService:
    """Mock CartService that returns predetermined items."""

    def __init__(self, items=None):
        self._items = items or []
        self.cleared = False

    def get_items(self):
        return self._items

    def clear(self):
        self.cleared = True


@pytest.mark.django_db
class TestCheckoutService:
    def _make_service(self, user, cart_items):
        service = CheckoutService(user)
        service.cart_service = FakeCartService(cart_items)
        return service

    def test_create_order_success(self, user):
        v1 = ProductVariantFactory(price=Decimal('10.00'), stock=50)
        v2 = ProductVariantFactory(price=Decimal('25.00'), stock=30)
        cart_items = [
            {'variant_id': v1.id, 'quantity': 2},
            {'variant_id': v2.id, 'quantity': 1},
        ]
        service = self._make_service(user, cart_items)
        order = service.create_order(shipping_address='123 Main St')

        assert order.user == user
        assert order.total_amount == Decimal('45.00')
        assert order.shipping_address == '123 Main St'
        assert order.status == Order.Status.PENDING
        assert order.items.count() == 2

        v1.refresh_from_db()
        v2.refresh_from_db()
        assert v1.stock == 48
        assert v2.stock == 29

        assert service.cart_service.cleared

    def test_empty_cart_raises(self, user):
        service = self._make_service(user, [])
        with pytest.raises(ValidationError, match='empty'):
            service.create_order()

    def test_insufficient_stock_raises(self, user):
        v = ProductVariantFactory(price=Decimal('10.00'), stock=2)
        cart_items = [{'variant_id': v.id, 'quantity': 5}]
        service = self._make_service(user, cart_items)
        with pytest.raises(ValidationError, match='Insufficient stock'):
            service.create_order()

        v.refresh_from_db()
        assert v.stock == 2  # stock unchanged

    def test_inactive_variant_raises(self, user):
        v = ProductVariantFactory(is_active=False, stock=50)
        cart_items = [{'variant_id': v.id, 'quantity': 1}]
        service = self._make_service(user, cart_items)
        with pytest.raises(ValidationError, match='not available'):
            service.create_order()

    def test_nonexistent_variant_raises(self, user):
        cart_items = [{'variant_id': 99999, 'quantity': 1}]
        service = self._make_service(user, cart_items)
        with pytest.raises(ValidationError, match='not available'):
            service.create_order()
