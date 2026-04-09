import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

export function HomePage() {
  const { data, isLoading } = useProducts({ ordering: '-created_at', page_size: 8 });

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-16 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl font-bold">Welcome to Urban Attic</h1>
          <p className="mb-8 text-xl text-slate-200">
            Discover amazing products at unbeatable prices. Shop now and enjoy fast, reliable delivery.
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary" className="gap-2">
              Browse Products
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">Latest Products</h2>
          <Link to="/products">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ProductGrid products={data?.results || []} isLoading={isLoading} />
      </section>
    </div>
  );
}
