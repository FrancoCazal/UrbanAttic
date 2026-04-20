import pytest
from apps.products.tests.factories import ProductFactory
from apps.wishlist.models import WishlistItem


@pytest.mark.django_db
class TestWishlistList:
    url = '/api/v1/wishlist/'

    def test_empty_wishlist(self, auth_client):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data['results'] == []

    def test_list_with_items(self, auth_client, user):
        products = [ProductFactory() for _ in range(3)]
        for p in products:
            WishlistItem.objects.create(user=user, product=p)

        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401


@pytest.mark.django_db
class TestWishlistToggle:
    def _url(self, slug):
        return f'/api/v1/wishlist/toggle/{slug}/'

    def test_add_product(self, auth_client, user):
        product = ProductFactory()
        response = auth_client.post(self._url(product.slug))
        assert response.status_code == 200
        assert response.data['in_wishlist'] is True
        assert WishlistItem.objects.filter(user=user, product=product).exists()

    def test_remove_existing_product(self, auth_client, user):
        product = ProductFactory()
        WishlistItem.objects.create(user=user, product=product)

        response = auth_client.post(self._url(product.slug))
        assert response.status_code == 200
        assert response.data['in_wishlist'] is False
        assert not WishlistItem.objects.filter(user=user, product=product).exists()

    def test_nonexistent_product_returns_404(self, auth_client):
        response = auth_client.post(self._url('does-not-exist'))
        assert response.status_code == 404

    def test_unauthenticated_returns_401(self, api_client):
        product = ProductFactory()
        response = api_client.post(self._url(product.slug))
        assert response.status_code == 401

    def test_inactive_product_returns_404(self, auth_client):
        product = ProductFactory(is_active=False)
        response = auth_client.post(self._url(product.slug))
        assert response.status_code == 404

    def test_toggle_is_user_scoped(self, api_client, user, admin_user):
        product = ProductFactory()
        api_client.force_authenticate(user=user)
        api_client.post(self._url(product.slug))
        assert WishlistItem.objects.filter(user=user).count() == 1

        api_client.force_authenticate(user=admin_user)
        response = api_client.post(self._url(product.slug))
        assert response.status_code == 200
        assert response.data['in_wishlist'] is True
        assert WishlistItem.objects.filter(user=admin_user).count() == 1
        assert WishlistItem.objects.filter(user=user).count() == 1
