import pytest
from decimal import Decimal
from apps.products.tests.factories import CategoryFactory, ProductFactory, ProductVariantFactory


@pytest.mark.django_db
class TestCategoryModel:
    def test_str(self):
        category = CategoryFactory(name='Electronics')
        assert str(category) == 'Electronics'

    def test_ordering(self):
        CategoryFactory(name='Zebra')
        CategoryFactory(name='Alpha')
        from apps.products.models import Category
        names = list(Category.objects.values_list('name', flat=True))
        assert names == ['Alpha', 'Zebra']

    def test_hierarchy(self):
        parent = CategoryFactory(name='Ropa')
        child = CategoryFactory(name='Remeras', parent=parent)
        assert child.parent == parent
        assert list(parent.children.all()) == [child]

    def test_get_descendants(self):
        root = CategoryFactory(name='Ropa')
        hombre = CategoryFactory(name='Hombre', parent=root)
        remeras = CategoryFactory(name='Remeras', parent=hombre)
        descendants = root.get_descendants()
        assert hombre in descendants
        assert remeras in descendants


@pytest.mark.django_db
class TestProductModel:
    def test_str(self):
        product = ProductFactory(name='Test Widget')
        assert str(product) == 'Test Widget'

    def test_default_ordering_by_created_at_desc(self):
        p1 = ProductFactory(name='First')
        p2 = ProductFactory(name='Second')
        from apps.products.models import Product
        products = list(Product.objects.values_list('name', flat=True))
        assert products == ['Second', 'First']

    def test_category_protect_on_delete(self):
        product = ProductFactory()
        with pytest.raises(Exception):
            product.category.delete()

    def test_base_price_from_main_variant(self):
        product = ProductFactory()
        ProductVariantFactory(product=product, price=Decimal('15.00'), is_main=True)
        ProductVariantFactory(product=product, price=Decimal('20.00'), is_main=False)
        assert product.base_price == Decimal('15.00')

    def test_total_stock(self):
        product = ProductFactory()
        ProductVariantFactory(product=product, stock=10)
        ProductVariantFactory(product=product, stock=20)
        assert product.total_stock == 30


@pytest.mark.django_db
class TestProductVariantModel:
    def test_str(self):
        variant = ProductVariantFactory(name='Talle: M, Color: Negro')
        assert 'Talle: M, Color: Negro' in str(variant)

    def test_unique_sku(self):
        ProductVariantFactory(sku='UNIQUE-001')
        with pytest.raises(Exception):
            ProductVariantFactory(sku='UNIQUE-001')
