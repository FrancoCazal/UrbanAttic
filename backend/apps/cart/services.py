import redis
from decimal import Decimal
from django.conf import settings
from apps.products.models import ProductVariant


class CartService:
    """
    Redis-backed cart. Each user's cart is a Redis hash at key
    'cart:user:{user_id}', where field = variant_id, value = quantity.
    """

    def __init__(self, user):
        self.user = user
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.key = f'cart:user:{user.id}'

    def _refresh_ttl(self):
        self.redis.expire(self.key, settings.CART_TTL)

    def get_items(self):
        raw = self.redis.hgetall(self.key)
        return [
            {'variant_id': int(vid), 'quantity': int(qty)}
            for vid, qty in raw.items()
        ]

    def add(self, variant_id, quantity=1):
        new_qty = self.redis.hincrby(self.key, str(variant_id), quantity)
        self._refresh_ttl()
        return new_qty

    def update(self, variant_id, quantity):
        if quantity <= 0:
            return self.remove(variant_id)
        self.redis.hset(self.key, str(variant_id), quantity)
        self._refresh_ttl()
        return quantity

    def remove(self, variant_id):
        self.redis.hdel(self.key, str(variant_id))
        self._refresh_ttl()

    def clear(self):
        self.redis.delete(self.key)

    def get_cart_detail(self, request=None):
        items = self.get_items()
        if not items:
            return {'items': [], 'total': Decimal('0.00'), 'count': 0}

        variant_ids = [item['variant_id'] for item in items]
        variants = ProductVariant.objects.filter(
            id__in=variant_ids, is_active=True,
        ).select_related('product', 'image').in_bulk()

        cart_items = []
        total = Decimal('0.00')
        for item in items:
            variant = variants.get(item['variant_id'])
            if variant is None:
                self.remove(item['variant_id'])
                continue
            line_total = variant.price * item['quantity']
            total += line_total

            image_url = None
            if variant.image and variant.image.image:
                url = variant.image.image.url
                image_url = request.build_absolute_uri(url) if request else url
            elif variant.product.primary_image:
                img = variant.product.primary_image
                if img.image:
                    url = img.image.url
                    image_url = request.build_absolute_uri(url) if request else url

            cart_items.append({
                'variant_id': variant.id,
                'product_id': variant.product.id,
                'product_name': variant.product.name,
                'product_slug': variant.product.slug,
                'variant_name': variant.name,
                'sku': variant.sku,
                'price': variant.price,
                'image': image_url,
                'quantity': item['quantity'],
                'line_total': line_total,
            })

        return {
            'items': cart_items,
            'total': total,
            'count': sum(i['quantity'] for i in cart_items),
        }
