from rest_framework import serializers
from apps.products.models import Category, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    parent_id = serializers.IntegerField(source='parent.id', read_only=True, default=None)

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent_id')


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'children')

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategoryTreeSerializer(children, many=True).data


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'position', 'is_primary')


class ProductVariantSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ('id', 'name', 'sku', 'price', 'stock', 'attributes', 'is_main', 'image_url')

    def get_image_url(self, obj):
        if obj.image and obj.image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.image.url)
            return obj.image.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'price', 'stock', 'category', 'image')

    def get_price(self, obj):
        return obj.base_price

    def get_stock(self, obj):
        return obj.total_stock

    def get_image(self, obj):
        img = obj.primary_image
        if img and img.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description',
            'price', 'stock', 'category', 'images', 'variants',
            'is_active', 'created_at', 'updated_at',
        )

    def get_price(self, obj):
        return obj.base_price

    def get_stock(self, obj):
        return obj.total_stock


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('name', 'slug', 'description', 'category')
