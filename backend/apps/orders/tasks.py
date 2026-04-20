import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id):
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related('user').get(pk=order_id)
        send_mail(
            subject=f'Order #{order.pk} Confirmation',
            message=(
                f'Hi {order.user.first_name},\n\n'
                f'Your order #{order.pk} has been received.\n'
                f'Total: ${order.total_amount}\n'
                f'Status: {order.get_status_display()}\n\n'
                f'Thank you for your purchase!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        response_body = getattr(getattr(exc, 'response', None), 'text', None)
        logger.error(
            'send_order_confirmation_email failed for order_id=%s: %s %r | response=%s',
            order_id, type(exc).__name__, exc, response_body,
            exc_info=True,
        )
        raise self.retry(exc=exc)
