import pytest
from decimal import Decimal
from apps.cart.services import CartService
from apps.products.tests.factories import ProductVariantFactory


class FakeRedis:
    """In-memory Redis mock for testing."""

    def __init__(self):
        self._data = {}

    def hgetall(self, key):
        return dict(self._data.get(key, {}))

    def hincrby(self, key, field, amount):
        if key not in self._data:
            self._data[key] = {}
        current = int(self._data[key].get(field, 0))
        new_val = current + amount
        self._data[key][field] = str(new_val)
        return new_val

    def hset(self, key, field, value):
        if key not in self._data:
            self._data[key] = {}
        self._data[key][field] = str(value)

    def hdel(self, key, field):
        if key in self._data:
            self._data[key].pop(field, None)

    def delete(self, key):
        self._data.pop(key, None)

    def expire(self, key, ttl):
        pass


@pytest.fixture
def fake_redis():
    return FakeRedis()


@pytest.fixture
def cart_service(user, fake_redis):
    service = CartService(user)
    service.redis = fake_redis
    return service


@pytest.mark.django_db
class TestCartService:
    def test_add_item(self, cart_service):
        qty = cart_service.add(1, 2)
        assert qty == 2

    def test_add_increments_quantity(self, cart_service):
        cart_service.add(1, 2)
        qty = cart_service.add(1, 3)
        assert qty == 5

    def test_get_items(self, cart_service):
        cart_service.add(1, 2)
        cart_service.add(2, 1)
        items = cart_service.get_items()
        assert len(items) == 2
        ids = {item['variant_id'] for item in items}
        assert ids == {1, 2}

    def test_update_item(self, cart_service):
        cart_service.add(1, 5)
        qty = cart_service.update(1, 3)
        assert qty == 3
        items = cart_service.get_items()
        assert items[0]['quantity'] == 3

    def test_update_to_zero_removes(self, cart_service):
        cart_service.add(1, 5)
        cart_service.update(1, 0)
        items = cart_service.get_items()
        assert len(items) == 0

    def test_remove_item(self, cart_service):
        cart_service.add(1, 2)
        cart_service.add(2, 1)
        cart_service.remove(1)
        items = cart_service.get_items()
        assert len(items) == 1
        assert items[0]['variant_id'] == 2

    def test_clear(self, cart_service):
        cart_service.add(1, 2)
        cart_service.add(2, 1)
        cart_service.clear()
        items = cart_service.get_items()
        assert len(items) == 0

    def test_get_cart_detail_empty(self, cart_service):
        detail = cart_service.get_cart_detail()
        assert detail['items'] == []
        assert detail['total'] == Decimal('0.00')
        assert detail['count'] == 0

    def test_get_cart_detail_with_variants(self, cart_service):
        v1 = ProductVariantFactory(price=Decimal('10.00'))
        v2 = ProductVariantFactory(price=Decimal('20.00'))
        cart_service.add(v1.id, 2)
        cart_service.add(v2.id, 1)
        detail = cart_service.get_cart_detail()
        assert detail['total'] == Decimal('40.00')
        assert detail['count'] == 3
        assert len(detail['items']) == 2

    def test_get_cart_detail_removes_inactive_variants(self, cart_service):
        v = ProductVariantFactory(is_active=False)
        cart_service.add(v.id, 1)
        detail = cart_service.get_cart_detail()
        assert len(detail['items']) == 0
