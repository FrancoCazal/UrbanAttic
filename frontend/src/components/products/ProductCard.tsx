import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useT } from '@/lib/settings-context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useT();
  const imageUrl = product.image || null;
  const categoryName = typeof product.category === 'object' ? product.category.name : '';

  return (
    <Link to={`/products/${product.slug}`}>
      <article className="group cursor-pointer">
        <div className="relative aspect-[3/4] bg-surface-container overflow-hidden transition-all group-hover:outline group-hover:outline-2 group-hover:outline-on-surface group-hover:outline-offset-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-secondary font-headline uppercase text-sm">
              {t.product.noImage}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-4 right-4 bg-on-surface text-white text-[10px] font-bold px-2 py-1 uppercase font-headline">
              {t.catalog.soldOut}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between items-start">
          <div>
            <h4 className="font-headline font-bold text-sm tracking-tight uppercase mb-1">{product.name}</h4>
            {categoryName && (
              <p className="text-[10px] text-secondary font-bold uppercase">{categoryName}</p>
            )}
          </div>
          <span className="font-headline font-bold text-sm text-primary">{formatCurrency(product.price)}</span>
        </div>
      </article>
    </Link>
  );
}
