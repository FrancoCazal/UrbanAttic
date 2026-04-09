import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useT } from '@/lib/settings-context';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const t = useT();
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
        toast.success(t.cart.itemRemoved);
      },
      onError: () => {
        toast.error('Failed to remove item');
      },
    });
  };

  const imageUrl = item.image || null;

  return (
    <article className="group flex flex-col md:flex-row gap-6 border-2 border-on-surface p-6 bg-surface-container-low transition-colors hover:bg-white">
      <Link to={`/products/${item.product_slug}`} className="w-full md:w-48 h-48 bg-surface-container-highest shrink-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product_name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-secondary font-headline uppercase text-xs">
            NO IMAGE
          </div>
        )}
      </Link>

      <div className="flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start">
            <Link to={`/products/${item.product_slug}`}>
              <h3 className="font-headline font-bold text-2xl uppercase tracking-tight hover:text-primary transition-colors">
                {item.product_name}
              </h3>
            </Link>
            <button
              onClick={handleRemove}
              disabled={removeCartItem.isPending}
              className="text-on-surface hover:text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-secondary font-body mt-1 text-sm">{item.variant_name}</p>
        </div>

        <div className="flex justify-between items-end mt-6">
          <div className="flex items-center border-2 border-on-surface">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateCartItem.isPending}
              className="px-3 py-1 hover:bg-on-surface hover:text-surface transition-colors font-bold disabled:opacity-30"
            >
              -
            </button>
            <span className="px-6 py-1 font-headline font-bold border-x-2 border-on-surface">
              {String(item.quantity).padStart(2, '0')}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updateCartItem.isPending}
              className="px-3 py-1 hover:bg-on-surface hover:text-surface transition-colors font-bold"
            >
              +
            </button>
          </div>
          <span className="font-headline font-black text-2xl">{formatCurrency(item.line_total)}</span>
        </div>
      </div>
    </article>
  );
}
