import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderItemsTable } from '@/components/orders/OrderItemsTable';
import { useOrder, useCancelOrder, useCreateCheckoutSession } from '@/hooks/useOrders';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

export function OrderDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(parseInt(id!));
  const cancelOrder = useCancelOrder();
  const retryCheckout = useCreateCheckoutSession();

  const handlePayNow = () => {
    if (!order) return;
    retryCheckout.mutate(order.id, {
      onSuccess: (data) => {
        window.location.href = data.checkout_url;
      },
      onError: () => {
        toast.error('Failed to create checkout session');
      },
    });
  };

  const handleCancelOrder = () => {
    if (!order) return;

    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(order.id, {
        onSuccess: () => {
          toast.success('Order cancelled successfully');
        },
        onError: () => {
          toast.error('Failed to cancel order');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-on-surface">Order not found</h1>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-secondary hover:text-on-surface"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.orders.backToOrders}
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-on-surface">Order #{order.id}</h1>
          <p className="text-secondary">Placed on {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-on-surface">Shipping Address</h3>
                  <p className="mt-1 whitespace-pre-line text-on-surface">{order.shipping_address}</p>
                </div>
                {order.notes && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-on-surface">Order Notes</h3>
                    <p className="mt-1 text-on-surface">{order.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Subtotal</span>
                <span className="font-medium text-on-surface">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-secondary">Payment</span>
                <Badge
                  variant={
                    order.payment_status === 'paid' ? 'default' :
                    order.payment_status === 'cancelled' ? 'destructive' :
                    'secondary'
                  }
                >
                  {order.payment_status === 'paid' ? 'Paid' :
                   order.payment_status === 'cancelled' ? 'Cancelled' :
                   'Awaiting Payment'}
                </Badge>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-on-surface">Total</span>
                <span className="text-xl font-bold text-on-surface">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {order.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={handlePayNow}
                  disabled={retryCheckout.isPending}
                >
                  <CreditCard className="h-4 w-4" />
                  {retryCheckout.isPending ? t.orders.redirecting : t.orders.payNow}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelOrder}
                  disabled={cancelOrder.isPending}
                >
                  {t.orders.cancelOrder}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
