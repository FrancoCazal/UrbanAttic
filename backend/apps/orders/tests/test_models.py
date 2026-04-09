import pytest
from decimal import Decimal
from apps.orders.tests.factories import OrderFactory, OrderItemFactory


@pytest.mark.django_db
class TestOrderModel:
    def test_str(self):
        order = OrderFactory()
        assert f'Order #{order.pk}' in str(order)

    def test_default_status_is_pending(self):
        order = OrderFactory()
        assert order.status == 'pending'


@pytest.mark.django_db
class TestOrderItemModel:
    def test_line_total(self):
        item = OrderItemFactory(quantity=3, price=Decimal('15.00'))
        assert item.line_total == Decimal('45.00')

    def test_str(self):
        item = OrderItemFactory()
        assert str(item.variant) in str(item)
