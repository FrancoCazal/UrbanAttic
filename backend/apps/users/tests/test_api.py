from unittest.mock import patch
import pytest
from django.urls import reverse
from apps.users.models import User
from apps.users.tasks import make_verification_token, make_password_reset_token


@pytest.mark.django_db
class TestRegister:
    url = '/api/v1/auth/register/'

    def test_register_success(self, api_client):
        data = {
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'securepass123',
        }
        with patch('apps.users.api.views.send_verification_email.delay') as mock_send:
            response = api_client.post(self.url, data)
        assert response.status_code == 201
        assert User.objects.filter(email='new@example.com').exists()
        mock_send.assert_called_once()

    def test_register_short_password(self, api_client):
        data = {
            'email': 'short@example.com',
            'first_name': 'Short',
            'last_name': 'Pass',
            'password': '123',
        }
        response = api_client.post(self.url, data)
        assert response.status_code == 400

    def test_register_duplicate_email(self, api_client, user):
        data = {
            'email': user.email,
            'first_name': 'Dup',
            'last_name': 'User',
            'password': 'securepass123',
        }
        response = api_client.post(self.url, data)
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    url = '/api/v1/auth/login/'

    def test_login_success_when_verified(self, api_client, user):
        user.email_verified = True
        user.save()
        response = api_client.post(self.url, {
            'email': user.email,
            'password': 'testpass123',
        })
        assert response.status_code == 200
        assert 'access_token' in response.cookies

    def test_login_blocked_when_not_verified(self, api_client, user):
        assert user.email_verified is False
        response = api_client.post(self.url, {
            'email': user.email,
            'password': 'testpass123',
        })
        assert response.status_code == 403
        assert response.data['code'] == 'email_not_verified'
        assert 'access_token' not in response.cookies

    def test_login_wrong_password(self, api_client, user):
        response = api_client.post(self.url, {
            'email': user.email,
            'password': 'wrongpass',
        })
        assert response.status_code == 401


@pytest.mark.django_db
class TestLogout:
    url = '/api/v1/auth/logout/'

    def test_logout_clears_cookies(self, auth_client):
        response = auth_client.post(self.url)
        assert response.status_code == 200


@pytest.mark.django_db
class TestUserProfile:
    url = '/api/v1/auth/me/'

    def test_get_profile(self, auth_client, user):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data['email'] == user.email

    def test_update_profile(self, auth_client):
        response = auth_client.patch(self.url, {'first_name': 'Updated'})
        assert response.status_code == 200
        assert response.data['first_name'] == 'Updated'

    def test_unauthenticated_access(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401


@pytest.mark.django_db
class TestVerifyEmail:
    url = '/api/v1/auth/verify-email/'

    def test_valid_token_marks_verified(self, api_client, user):
        assert user.email_verified is False
        token = make_verification_token(user.pk)
        response = api_client.post(self.url, {'token': token})
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email_verified is True

    def test_invalid_token_returns_400(self, api_client, user):
        response = api_client.post(self.url, {'token': 'totally-invalid'})
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email_verified is False

    def test_token_for_nonexistent_user(self, api_client):
        token = make_verification_token(99999)
        response = api_client.post(self.url, {'token': token})
        assert response.status_code == 400

    def test_missing_token(self, api_client):
        response = api_client.post(self.url, {})
        assert response.status_code == 400


@pytest.mark.django_db
class TestResendVerification:
    url = '/api/v1/auth/resend-verification/'

    def test_resend_for_unverified_user(self, api_client, user):
        assert user.email_verified is False
        with patch('apps.users.api.views.send_verification_email.delay') as mock_send:
            response = api_client.post(self.url, {'email': user.email})
        assert response.status_code == 200
        mock_send.assert_called_once_with(user.pk)

    def test_noop_for_verified_user(self, api_client, user):
        user.email_verified = True
        user.save()
        with patch('apps.users.api.views.send_verification_email.delay') as mock_send:
            response = api_client.post(self.url, {'email': user.email})
        assert response.status_code == 200
        mock_send.assert_not_called()

    def test_noop_for_nonexistent_email(self, api_client):
        with patch('apps.users.api.views.send_verification_email.delay') as mock_send:
            response = api_client.post(self.url, {'email': 'nobody@example.com'})
        assert response.status_code == 200
        mock_send.assert_not_called()

    def test_invalid_email_format(self, api_client):
        response = api_client.post(self.url, {'email': 'not-an-email'})
        assert response.status_code == 400


@pytest.mark.django_db
class TestPasswordResetRequest:
    url = '/api/v1/auth/password-reset-request/'

    def test_request_for_existing_user_dispatches_task(self, api_client, user):
        with patch('apps.users.api.views.send_password_reset_email.delay') as mock_send:
            response = api_client.post(self.url, {'email': user.email})
        assert response.status_code == 200
        mock_send.assert_called_once_with(user.pk)

    def test_request_for_nonexistent_user_returns_200_no_dispatch(self, api_client):
        with patch('apps.users.api.views.send_password_reset_email.delay') as mock_send:
            response = api_client.post(self.url, {'email': 'nobody@example.com'})
        assert response.status_code == 200
        mock_send.assert_not_called()

    def test_invalid_email_format(self, api_client):
        response = api_client.post(self.url, {'email': 'not-an-email'})
        assert response.status_code == 400


@pytest.mark.django_db
class TestPasswordResetConfirm:
    url = '/api/v1/auth/password-reset-confirm/'

    def test_valid_token_resets_password(self, api_client, user):
        token = make_password_reset_token(user.pk)
        response = api_client.post(self.url, {'token': token, 'new_password': 'brandnew1234'})
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.check_password('brandnew1234')

    def test_invalid_token(self, api_client, user):
        original = user.password
        response = api_client.post(self.url, {'token': 'bad', 'new_password': 'brandnew1234'})
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.password == original

    def test_short_password(self, api_client, user):
        token = make_password_reset_token(user.pk)
        response = api_client.post(self.url, {'token': token, 'new_password': '123'})
        assert response.status_code == 400
