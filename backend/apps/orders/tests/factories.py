import factory
from decimal import Decimal
from apps.orders.models import Order, OrderItem
from apps.users.models import User
from apps.products.tests.factories import ProductVariantFactory


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = 'Test'
    last_name = 'User'
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    total_amount = Decimal('59.98')
    shipping_address = '123 Test Street'


class OrderItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrderItem

    order = factory.SubFactory(OrderFactory)
    variant = factory.SubFactory(ProductVariantFactory)
    quantity = 2
    price = Decimal('29.99')
