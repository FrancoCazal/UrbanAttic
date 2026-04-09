import factory
from decimal import Decimal
from apps.products.models import Category, Product, ProductVariant, ProductImage


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f'Category {n}')
    slug = factory.Sequence(lambda n: f'category-{n}')
    is_active = True


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence(lambda n: f'Product {n}')
    slug = factory.Sequence(lambda n: f'product-{n}')
    description = 'A test product.'
    category = factory.SubFactory(CategoryFactory)
    is_active = True


class ProductVariantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductVariant

    product = factory.SubFactory(ProductFactory)
    name = factory.Sequence(lambda n: f'Variant {n}')
    sku = factory.Sequence(lambda n: f'SKU-{n:04d}')
    price = Decimal('29.99')
    stock = 50
    attributes = factory.LazyFunction(lambda: {'color': 'Negro', 'talle': 'M'})
    is_main = False
    is_active = True
