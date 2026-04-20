from unittest.mock import patch
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestHealthCheck:
    def test_returns_200_when_db_and_redis_are_ok(self):
        with patch('apps.core.views._check_redis', return_value={'status': 'ok', 'latency_ms': 1.0}):
            resp = APIClient().get('/api/v1/health/')
        assert resp.status_code == 200
        assert resp.data['status'] == 'healthy'
        assert resp.data['checks']['database']['status'] == 'ok'
        assert resp.data['checks']['redis']['status'] == 'ok'

    def test_returns_503_when_redis_is_down(self):
        fake_redis = {'status': 'error', 'error': 'connection refused'}
        with patch('apps.core.views._check_redis', return_value=fake_redis):
            resp = APIClient().get('/api/v1/health/')
        assert resp.status_code == 503
        assert resp.data['status'] == 'degraded'
        assert resp.data['checks']['redis']['status'] == 'error'

    def test_returns_503_when_db_is_down(self):
        fake_db = {'status': 'error', 'error': 'connection refused'}
        with patch('apps.core.views._check_database', return_value=fake_db), \
             patch('apps.core.views._check_redis', return_value={'status': 'ok', 'latency_ms': 1.0}):
            resp = APIClient().get('/api/v1/health/')
        assert resp.status_code == 503
        assert resp.data['checks']['database']['status'] == 'error'
