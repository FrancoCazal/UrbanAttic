import time
import redis
from django.conf import settings
from django.db import connection
from rest_framework import serializers as drf_serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer


def _check_database():
    start = time.perf_counter()
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        return {'status': 'ok', 'latency_ms': round((time.perf_counter() - start) * 1000, 2)}
    except Exception as exc:
        return {'status': 'error', 'error': str(exc)}


def _check_redis():
    start = time.perf_counter()
    try:
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        return {'status': 'ok', 'latency_ms': round((time.perf_counter() - start) * 1000, 2)}
    except Exception as exc:
        return {'status': 'error', 'error': str(exc)}


class HealthCheckView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    @extend_schema(
        tags=['Health'],
        summary='Health check',
        description='Returns service status with DB and Redis connectivity checks. Returns 503 if any dependency is unreachable.',
        responses={
            200: inline_serializer('HealthOK', fields={
                'status': drf_serializers.CharField(default='healthy'),
                'checks': drf_serializers.DictField(),
            }),
            503: inline_serializer('HealthDegraded', fields={
                'status': drf_serializers.CharField(default='degraded'),
                'checks': drf_serializers.DictField(),
            }),
        },
    )
    def get(self, request):
        checks = {
            'database': _check_database(),
            'redis': _check_redis(),
        }
        healthy = all(c['status'] == 'ok' for c in checks.values())
        return Response(
            {'status': 'healthy' if healthy else 'degraded', 'checks': checks},
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
