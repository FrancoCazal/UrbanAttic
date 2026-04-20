from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.middleware.csrf import get_token
from rest_framework import generics, serializers as drf_serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer
from apps.users.api.serializers import (
    RegisterSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from apps.users.tasks import (
    send_verification_email,
    send_password_reset_email,
    EMAIL_VERIFICATION_SALT,
    PASSWORD_RESET_SALT,
)

User = get_user_model()

VERIFICATION_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60  # 24 hours
PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS = 60 * 60  # 1 hour


def _decode_signed_user_id(token, salt, max_age):
    signer = TimestampSigner(salt=salt)
    try:
        user_id_str = signer.unsign(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    try:
        return int(user_id_str)
    except ValueError:
        return None


def _set_auth_cookies(response, access, refresh):
    response.set_cookie(
        'access_token',
        str(access),
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
    )
    response.set_cookie(
        'refresh_token',
        str(refresh),
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        path='/api/v1/auth/',
    )


@extend_schema(
    tags=['Auth'],
    summary='Register a new user',
    description='Create a new user account with email and password.',
    examples=[
        OpenApiExample(
            'Registration',
            value={'email': 'user@example.com', 'first_name': 'John', 'last_name': 'Doe', 'password': 'securepass123'},
            request_only=True,
        ),
    ],
    responses={201: UserSerializer},
)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save()
        send_verification_email.delay(user.pk)


@extend_schema(
    tags=['Auth'],
    summary='Login',
    description='Authenticate with email and password. Sets JWT tokens in HttpOnly cookies and returns a CSRF token.',
    responses={200: inline_serializer('LoginResponse', fields={
        'detail': drf_serializers.CharField(default='Login successful.'),
        'csrftoken': drf_serializers.CharField(),
    })},
)
class CookieLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            return response

        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if user is not None and not user.email_verified:
            return Response(
                {
                    'detail': 'Please verify your email before logging in.',
                    'code': 'email_not_verified',
                    'email': user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        _set_auth_cookies(
            response,
            response.data['access'],
            response.data['refresh'],
        )
        csrf_token = get_token(request)
        response.data = {
            'detail': 'Login successful.',
            'csrftoken': csrf_token,
        }
        return response


@extend_schema(
    tags=['Auth'],
    summary='Refresh access token',
    description='Refresh the JWT access token. Reads the refresh token from HttpOnly cookie automatically.',
    responses={200: inline_serializer('RefreshResponse', fields={
        'detail': drf_serializers.CharField(default='Token refreshed.'),
    })},
)
class CookieRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Read refresh token from cookie if not in body
        if 'refresh' not in request.data:
            refresh = request.COOKIES.get('refresh_token')
            if refresh:
                if hasattr(request.data, '_mutable'):
                    request.data._mutable = True
                    request.data['refresh'] = refresh
                    request.data._mutable = False
                else:
                    request.data['refresh'] = refresh

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            _set_auth_cookies(
                response,
                response.data['access'],
                response.data.get('refresh', request.data.get('refresh')),
            )
            response.data = {'detail': 'Token refreshed.'}
        return response


@extend_schema(
    tags=['Auth'],
    summary='Logout',
    description='Blacklist the refresh token and clear auth cookies.',
    request=None,
    responses={200: inline_serializer('LogoutResponse', fields={
        'detail': drf_serializers.CharField(default='Logged out.'),
    })},
)
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token', path='/api/v1/auth/')
        return response


@extend_schema(tags=['Auth'], summary='Get or update user profile')
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=['Auth'],
    summary='Verify email',
    description='Validate the email verification token sent on registration and mark the account as verified.',
    request=VerifyEmailSerializer,
    responses={
        200: inline_serializer('VerifyEmailOK', fields={
            'detail': drf_serializers.CharField(default='Email verified.'),
        }),
        400: inline_serializer('VerifyEmailFail', fields={
            'detail': drf_serializers.CharField(),
        }),
    },
)
class VerifyEmailView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = _decode_signed_user_id(
            serializer.validated_data['token'],
            salt=EMAIL_VERIFICATION_SALT,
            max_age=VERIFICATION_TOKEN_MAX_AGE_SECONDS,
        )
        if user_id is None:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified'])

        return Response({'detail': 'Email verified.'}, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Auth'],
    summary='Resend verification email',
    description='Re-send the email verification link. Always returns 200 regardless of whether the email exists (prevents enumeration). No-op if email is already verified.',
    request=ResendVerificationSerializer,
    responses={200: inline_serializer('ResendVerificationOK', fields={
        'detail': drf_serializers.CharField(default='If that email is registered and unverified, a verification link has been sent.'),
    })},
)
class ResendVerificationView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if user is not None and not user.email_verified:
            send_verification_email.delay(user.pk)

        return Response(
            {'detail': 'If that email is registered and unverified, a verification link has been sent.'},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=['Auth'],
    summary='Request password reset',
    description='Request a password reset email. Always returns 200 regardless of whether the email is registered (prevents user enumeration).',
    request=PasswordResetRequestSerializer,
    responses={200: inline_serializer('PasswordResetRequestOK', fields={
        'detail': drf_serializers.CharField(default='If that email is registered, a reset link has been sent.'),
    })},
)
class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if user is not None:
            send_password_reset_email.delay(user.pk)

        return Response(
            {'detail': 'If that email is registered, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=['Auth'],
    summary='Confirm password reset',
    description='Submit a new password using the token sent by email.',
    request=PasswordResetConfirmSerializer,
    responses={
        200: inline_serializer('PasswordResetConfirmOK', fields={
            'detail': drf_serializers.CharField(default='Password updated.'),
        }),
        400: inline_serializer('PasswordResetConfirmFail', fields={
            'detail': drf_serializers.CharField(),
        }),
    },
)
class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = _decode_signed_user_id(
            serializer.validated_data['token'],
            salt=PASSWORD_RESET_SALT,
            max_age=PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS,
        )
        if user_id is None:
            return Response(
                {'detail': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password updated.'}, status=status.HTTP_200_OK)
