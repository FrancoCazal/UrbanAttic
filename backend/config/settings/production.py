from .base import *
from decouple import config, Csv

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Whitenoise — serve static files from Django in production
MIDDLEWARE.insert(
    MIDDLEWARE.index('django.middleware.security.SecurityMiddleware') + 1,
    'whitenoise.middleware.WhiteNoiseMiddleware',
)
# Media files — S3
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_QUERYSTRING_AUTH = False
AWS_DEFAULT_ACL = None

STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Security
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Email
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
