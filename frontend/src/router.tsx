import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingFallback = () => (
  <div className="max-w-[1600px] mx-auto px-6 py-12">
    <div className="space-y-4">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const ProductsPage = lazy(() =>
  import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CartPage = lazy(() =>
  import('@/pages/CartPage').then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const OrdersPage = lazy(() =>
  import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('@/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const CheckoutSuccessPage = lazy(() =>
  import('@/pages/CheckoutSuccessPage').then((m) => ({ default: m.CheckoutSuccessPage }))
);
const CheckoutCancelPage = lazy(() =>
  import('@/pages/CheckoutCancelPage').then((m) => ({ default: m.CheckoutCancelPage }))
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const WishlistPage = lazy(() =>
  import('@/pages/WishlistPage').then((m) => ({ default: m.WishlistPage }))
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Suspense fallback={<LoadingFallback />}><HomePage /></Suspense></Layout>,
  },
  {
    path: '/products',
    element: <Layout><Suspense fallback={<LoadingFallback />}><ProductsPage /></Suspense></Layout>,
  },
  {
    path: '/products/:slug',
    element: <Layout><Suspense fallback={<LoadingFallback />}><ProductDetailPage /></Suspense></Layout>,
  },
  {
    path: '/cart',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CartPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/checkout',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CheckoutPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/checkout/success',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CheckoutSuccessPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/checkout/cancel',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CheckoutCancelPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/orders',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <OrdersPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/orders/:id',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <OrderDetailPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/login',
    element: <Layout><Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense></Layout>,
  },
  {
    path: '/register',
    element: <Layout><Suspense fallback={<LoadingFallback />}><RegisterPage /></Suspense></Layout>,
  },
  {
    path: '/profile',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/verify-email',
    element: <Layout><Suspense fallback={<LoadingFallback />}><VerifyEmailPage /></Suspense></Layout>,
  },
  {
    path: '/forgot-password',
    element: <Layout><Suspense fallback={<LoadingFallback />}><ForgotPasswordPage /></Suspense></Layout>,
  },
  {
    path: '/reset-password',
    element: <Layout><Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense></Layout>,
  },
  {
    path: '/wishlist',
    element: (
      <Layout>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <WishlistPage />
          </Suspense>
        </ProtectedRoute>
      </Layout>
    ),
  },
]);
