import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProducts } from '@/hooks/useProducts';
import { useT } from '@/lib/settings-context';

const PAGE_SIZE = 8;

export function ProductsPage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search — triggers 400ms after user stops typing
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        params.set('search', searchInput.trim());
      } else {
        params.delete('search');
      }
      params.delete('page');
      setSearchParams(params, { replace: true });
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    ordering: searchParams.get('ordering') || 'name',
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useProducts(filters);

  const handleFilterChange = (newFilters: { category?: string; min_price?: number; max_price?: number }) => {
    const params = new URLSearchParams(searchParams);

    if (newFilters.category) {
      params.set('category', newFilters.category);
    } else {
      params.delete('category');
    }

    if (newFilters.min_price) {
      params.set('min_price', newFilters.min_price.toString());
    } else {
      params.delete('min_price');
    }

    if (newFilters.max_price) {
      params.set('max_price', newFilters.max_price.toString());
    } else {
      params.delete('max_price');
    }

    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasNextPage = !!data?.next;
  const hasPrevPage = !!data?.previous;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12 md:py-20">
      <Helmet>
        <title>Catalog | Urban Attic</title>
        <meta name="description" content="Browse our streetwear catalog. T-shirts, pants, jackets, accessories and more. Filter by category, price, and style." />
        <meta property="og:title" content="Catalog | Urban Attic" />
        <meta property="og:description" content="Browse our streetwear catalog. T-shirts, pants, jackets, accessories and more." />
        <meta property="og:url" content="https://urbanattic.vercel.app/products" />
      </Helmet>

      {/* Header */}
      <header className="mb-16 border-b-2 border-on-surface pb-8">
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-4 font-headline">{t.catalog.title}</h1>
        <div className="flex justify-between items-end">
          <p className="max-w-md text-secondary font-medium uppercase text-sm tracking-widest">
            {t.catalog.subtitle}
          </p>
          <div className="text-xs font-bold tracking-widest font-headline uppercase hidden md:block">{t.catalog.established}</div>
        </div>
      </header>

      {/* Mobile: Search + Filter Toggle */}
      <div className="md:hidden mb-8 space-y-4">
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              type="text"
              placeholder={t.catalog.scanPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border-2 border-on-surface px-4 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all w-full justify-center"
        >
          {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          {filtersOpen ? t.nav.closeFilters : t.nav.filters}
        </button>
        {filtersOpen && (
          <div className="border-2 border-on-surface p-6">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar — Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-32">
            <div className="mb-12">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <Input
                  type="text"
                  placeholder={t.catalog.scanPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-grow">
          {data && (
            <div className="mb-8 text-xs text-secondary font-headline font-bold uppercase tracking-widest">
              {data.count} {t.catalog.objectsFound}
            </div>
          )}

          <ProductGrid products={data?.results || []} isLoading={isLoading} />

          {/* Pagination */}
          {data && (hasNextPage || hasPrevPage) && (
            <div className="mt-16 md:mt-24 border-t-2 border-on-surface pt-8 flex justify-center items-center gap-6 sm:gap-12 font-headline font-bold text-xs tracking-widest">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={!hasPrevPage}
                className="flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> {t.catalog.prev}
              </button>
              <span className="text-on-surface">PAGE {String(filters.page).padStart(2, '0')}</span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={!hasNextPage}
                className="flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-30"
              >
                {t.catalog.next} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
