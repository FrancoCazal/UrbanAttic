from django.urls import path
from apps.wishlist.api.views import WishlistListView, WishlistToggleView

urlpatterns = [
    path('', WishlistListView.as_view(), name='wishlist-list'),
    path('toggle/<slug:slug>/', WishlistToggleView.as_view(), name='wishlist-toggle'),
]
