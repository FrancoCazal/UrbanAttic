import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';
import { useT } from '@/lib/settings-context';

export function CartPage() {
  const t = useT();
  const { data: cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-12 md:px-12 lg:px-24">
        <Skeleton className="h-24 w-96 mb-16" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-16 md:px-12 lg:px-24">
        <div className="flex flex-col items-center py-24 border-2 border-on-surface">
          <ShoppingBag className="mb-6 h-16 w-16 text-secondary" />
          <h2 className="mb-2 font-headline text-4xl font-black uppercase tracking-tighter">{t.cart.empty}</h2>
          <p className="mb-8 text-secondary font-headline uppercase text-sm tracking-widest">{t.cart.emptySubtitle}</p>
          <Link
            to="/products"
            className="px-10 py-4 bg-primary-container text-white font-headline font-bold uppercase tracking-widest hover:bg-primary transition-all"
          >
            {t.cart.viewAllObjects}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12 md:px-12 lg:px-24">
      <Helmet>
        <title>Cart | Urban Attic</title>
      </Helmet>
      {/* Header */}
      <header className="mb-8 md:mb-16">
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black font-headline tracking-tighter uppercase leading-[0.8] text-on-surface">
          {t.cart.title} <br /> <span className="text-primary">{t.cart.titleAccent}</span>
        </h1>
        <p className="mt-4 font-body uppercase text-xs tracking-widest text-secondary opacity-70">
          {t.cart.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cart Items */}
        <section className="lg:col-span-8 space-y-8">
          {cart.items.map((item) => (
            <CartItem key={item.variant_id} item={item} />
          ))}

          {/* Hookup Code */}
          <section className="pt-8 border-t-2 border-on-surface/10">
            <label className="font-headline font-bold uppercase text-sm tracking-widest block mb-4">{t.cart.hookupCode}</label>
            <div className="flex flex-col sm:flex-row max-w-md">
              <input
                className="w-full bg-surface-container-high border-2 border-on-surface px-4 py-3 font-headline focus:ring-2 focus:ring-primary-container outline-none placeholder:text-on-surface/30"
                placeholder={t.cart.enterCode}
                type="text"
              />
              <button className="bg-on-surface text-surface px-8 py-3 font-headline font-bold uppercase tracking-tighter hover:bg-primary transition-colors active:scale-95 border-2 border-on-surface sm:border-l-0">
                {t.cart.apply}
              </button>
            </div>
          </section>
        </section>

        {/* Damage Sidebar */}
        <aside className="lg:col-span-4 sticky top-28">
          <CartSummary total={cart.total} itemCount={cart.count} />
        </aside>
      </div>
    </div>
  );
}
