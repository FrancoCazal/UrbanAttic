import logging
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.signing import TimestampSigner

logger = logging.getLogger(__name__)

User = get_user_model()

EMAIL_VERIFICATION_SALT = 'urbanattic.email-verification'
PASSWORD_RESET_SALT = 'urbanattic.password-reset'


def make_verification_token(user_id):
    signer = TimestampSigner(salt=EMAIL_VERIFICATION_SALT)
    return signer.sign(str(user_id))


def make_password_reset_token(user_id):
    signer = TimestampSigner(salt=PASSWORD_RESET_SALT)
    return signer.sign(str(user_id))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return

    token = make_verification_token(user.pk)
    link = f'{settings.FRONTEND_URL}/verify-email?token={token}'

    try:
        send_mail(
            subject='Verify your Urban Attic account',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Welcome to Urban Attic. Please verify your email by clicking the link below:\n\n'
                f'{link}\n\n'
                f'This link expires in 24 hours.\n\n'
                f'If you did not create an account, you can ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        response_body = getattr(getattr(exc, 'response', None), 'text', None)
        logger.error(
            'send_verification_email failed for user_id=%s: %s %r | response=%s',
            user_id, type(exc).__name__, exc, response_body,
            exc_info=True,
        )
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return

    token = make_password_reset_token(user.pk)
    link = f'{settings.FRONTEND_URL}/reset-password?token={token}'

    try:
        send_mail(
            subject='Reset your Urban Attic password',
            message=(
                f'Hi {user.first_name},\n\n'
                f'We received a request to reset your password. Click the link below to set a new one:\n\n'
                f'{link}\n\n'
                f'This link expires in 1 hour.\n\n'
                f'If you did not request this, you can ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        response_body = getattr(getattr(exc, 'response', None), 'text', None)
        logger.error(
            'send_password_reset_email failed for user_id=%s: %s %r | response=%s',
            user_id, type(exc).__name__, exc, response_body,
            exc_info=True,
        )
        raise self.retry(exc=exc)
