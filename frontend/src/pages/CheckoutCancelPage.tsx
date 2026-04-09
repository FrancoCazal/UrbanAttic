import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateCheckoutSession, useCancelOrder } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

export function CheckoutCancelPage() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const retryCheckout = useCreateCheckoutSession();
  const cancelOrder = useCancelOrder();

  const handleRetry = () => {
    if (!orderId) return;
    retryCheckout.mutate(parseInt(orderId), {
      onSuccess: (data) => {
        window.location.href = data.checkout_url;
      },
      onError: () => {
        toast.error('Failed to create checkout session. The order may have been cancelled.');
      },
    });
  };

  const handleCancel = () => {
    if (!orderId) return;
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(parseInt(orderId), {
        onSuccess: () => {
          toast.success('Order cancelled');
        },
        onError: () => {
          toast.error('Failed to cancel order');
        },
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-amber-500" />
            </div>

            <div>
              <h1 className="mb-2 text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface">
                {t.checkout.cancelledTitle}
              </h1>
              <p className="text-secondary">
                {t.checkout.cancelledMessage}
              </p>
            </div>

            {orderId && (
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full gap-2"
                  onClick={handleRetry}
                  disabled={retryCheckout.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryCheckout.isPending ? t.orders.redirecting : t.checkout.tryAgain}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-red-600 hover:text-red-700"
                  onClick={handleCancel}
                  disabled={cancelOrder.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {t.orders.cancelOrder}
                </Button>
              </div>
            )}

            <Link
              to="/products"
              className="block text-sm text-secondary hover:text-on-surface"
            >
              {t.checkout.returnToShop}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
