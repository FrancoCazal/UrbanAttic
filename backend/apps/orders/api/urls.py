from django.urls import path
from apps.orders.api.views import (
    OrderListCreateView,
    OrderDetailView,
    OrderCancelView,
    CreateCheckoutSessionView,
    StripeWebhookView,
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
    path('<int:pk>/checkout-session/', CreateCheckoutSessionView.as_view(), name='order-checkout-session'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
