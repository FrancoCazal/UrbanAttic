from django.db import models
from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='children',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ('name',)

    def __str__(self):
        return self.name

    def get_descendants(self):
        """Return all descendant categories (children, grandchildren, etc.)."""
        descendants = []
        children = Category.objects.filter(parent=self, is_active=True)
        for child in children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    def get_ancestors(self):
        """Return list of ancestors from root to parent."""
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors


class Product(TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='products',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'product'
        verbose_name_plural = 'products'
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return self.name

    @property
    def base_price(self):
        """Price from the main variant."""
        main = self.variants.filter(is_main=True).first()
        return main.price if main else None

    @property
    def total_stock(self):
        """Sum of stock across all active variants."""
        return self.variants.filter(is_active=True).aggregate(
            total=models.Sum('stock')
        )['total'] or 0

    @property
    def primary_image(self):
        """Primary image for listings."""
        img = self.images.filter(is_primary=True).first()
        return img or self.images.first()


class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='variants',
    )
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    attributes = models.JSONField(default=dict, blank=True)
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    image = models.ForeignKey(
        'ProductImage', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='variants',
    )

    class Meta:
        verbose_name = 'product variant'
        verbose_name_plural = 'product variants'

    def __str__(self):
        return f'{self.product.name} - {self.name}'


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='images',
    )
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'product image'
        verbose_name_plural = 'product images'
        ordering = ('position',)

    def __str__(self):
        return f'{self.product.name} - Image {self.position}'
