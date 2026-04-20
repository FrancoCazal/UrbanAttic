import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';

export function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const items = data?.results ?? [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Helmet>
        <title>Wishlist | Urban Attic</title>
      </Helmet>

      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-8 w-8" />
        <h1 className="text-4xl font-bold font-headline uppercase tracking-tighter text-on-surface">
          My Wishlist
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-16 w-16 text-secondary mb-4" />
          <h2 className="text-2xl font-bold font-headline uppercase tracking-tighter text-on-surface mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-secondary mb-6">
            Start saving products you love by tapping the heart icon.
          </p>
          <Link to="/products">
            <Button className="gap-2">
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
