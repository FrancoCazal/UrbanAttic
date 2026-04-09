import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

const checkoutSchema = z.object({
  shipping_address: z.string().min(10, 'Address must be at least 10 characters'),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    if (cart && cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const onSubmit = (data: CheckoutFormData) => {
    createOrder.mutate(data, {
      onSuccess: (response) => {
        if (response.checkout_url) {
          window.location.href = response.checkout_url;
        } else {
          toast.success('Order placed successfully!');
          navigate(`/orders/${response.id}`);
        }
      },
      onError: () => {
        toast.error('Failed to place order');
      },
    });
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl md:text-7xl font-black font-headline uppercase tracking-tighter">{t.checkout.title}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline uppercase tracking-tighter">{t.checkout.shippingInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="shipping_address" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.checkout.shippingAddress} *</Label>
                  <Textarea
                    id="shipping_address"
                    {...register('shipping_address')}
                    placeholder="Enter your full shipping address"
                    rows={4}
                    className="mt-2"
                  />
                  {errors.shipping_address && (
                    <p className="mt-1 text-sm text-red-500">{errors.shipping_address.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes" className="text-[10px] font-bold font-headline uppercase tracking-widest">{t.checkout.orderNotes}</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any special instructions for your order"
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? t.checkout.processing : t.checkout.proceedToPayment}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline uppercase tracking-tighter">{t.cart.damage}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-on-surface">{item.product_name}</p>
                      <p className="text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-on-surface">
                      {formatCurrency(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-on-surface">Total</span>
                <span className="text-xl font-bold text-on-surface">
                  {formatCurrency(cart.total)}
                </span>
              </div>

              <div className="rounded-lg bg-surface-container p-4 text-sm text-secondary">
                <p className="mb-2 font-medium text-on-surface">Order Details</p>
                <p>{cart.count} items</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
