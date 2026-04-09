import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';

export function CartPage() {
  const { data: cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ShoppingBag className="mb-4 h-16 w-16 text-slate-400" />
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mb-6 text-slate-600">Add some products to get started</p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-slate-900">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <Card>
            <CardContent className="p-6">
              {cart.items.map((item) => (
                <CartItem key={item.variant_id} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <CartSummary total={cart.total} itemCount={cart.count} />
        </div>
      </div>
    </div>
  );
}
