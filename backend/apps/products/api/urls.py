from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.api.views import CategoryListView, CategoryTreeView, ProductViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/tree/', CategoryTreeView.as_view(), name='category-tree'),
    path('', include(router.urls)),
]
