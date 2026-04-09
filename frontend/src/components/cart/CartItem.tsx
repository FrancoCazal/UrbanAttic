import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem as CartItemType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { toast } from 'sonner';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;

    updateCartItem.mutate(
      { variant_id: item.variant_id, quantity: newQuantity },
      {
        onError: () => {
          toast.error('Failed to update quantity');
        },
      }
    );
  };

  const handleRemove = () => {
    removeCartItem.mutate(item.variant_id, {
      onSuccess: () => {
        toast.success('Item removed from cart');
      },
      onError: () => {
        toast.error('Failed to remove item');
      },
    });
  };

  const imageUrl = item.image || null;

  return (
    <div className="flex gap-4 border-b border-slate-200 py-4">
      <Link to={`/products/${item.product_slug}`} className="flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product_name}
            className="h-24 w-24 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            to={`/products/${item.product_slug}`}
            className="font-semibold text-slate-900 hover:text-slate-700"
          >
            {item.product_name}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {item.variant_name}
          </p>
          <p className="text-sm text-slate-500">
            {formatCurrency(item.price)} each
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateCartItem.isPending}
            >
              -
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              className="w-16 text-center"
              min="1"
              disabled={updateCartItem.isPending}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updateCartItem.isPending}
            >
              +
            </Button>
          </div>

          <p className="ml-auto font-semibold text-slate-900">
            {formatCurrency(item.line_total)}
          </p>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={removeCartItem.isPending}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
