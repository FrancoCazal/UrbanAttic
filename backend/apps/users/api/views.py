from django.conf import settings
from django.middleware.csrf import get_token
from rest_framework import generics, serializers as drf_serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer
from apps.users.api.serializers import RegisterSerializer, UserSerializer


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
        if response.status_code == 200:
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
