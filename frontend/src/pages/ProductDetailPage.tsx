import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useUser } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { ProductVariant } from '@/lib/types';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug!);
  const { data: user } = useUser();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { colors, sizes } = useMemo(() => {
    if (!product?.variants) return { colors: [], sizes: [] };
    const colorSet = new Set<string>();
    const sizeSet = new Set<string>();
    product.variants.forEach((v) => {
      if (v.attributes.color) colorSet.add(v.attributes.color);
      if (v.attributes.size) sizeSet.add(v.attributes.size);
    });
    return { colors: Array.from(colorSet), sizes: Array.from(sizeSet) };
  }, [product?.variants]);

  const activeColor = selectedColor || colors[0] || null;
  const activeSize = selectedSize || sizes[0] || null;

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!product?.variants) return undefined;
    return product.variants.find((v) => {
      const colorMatch = !activeColor || v.attributes.color === activeColor;
      const sizeMatch = !activeSize || v.attributes.size === activeSize;
      return colorMatch && sizeMatch;
    });
  }, [product?.variants, activeColor, activeSize]);

  const mainImage = useMemo(() => {
    if (selectedVariant?.image_url) return selectedVariant.image_url;
    const primaryImg = product?.images?.find((img) => img.is_primary);
    return primaryImg?.image || product?.images?.[0]?.image || null;
  }, [selectedVariant, product?.images]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to your haul');
      return;
    }
    if (!selectedVariant) {
      toast.error('Please select all options');
      return;
    }
    if (selectedVariant.stock === 0) {
      toast.error('This variant is sold out');
      return;
    }

    addToCart.mutate(
      { variant_id: selectedVariant.id, quantity },
      {
        onSuccess: () => {
          toast.success(`${product!.name} secured`);
          setQuantity(1);
        },
        onError: () => {
          toast.error('Failed to add item');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-16 text-center">
        <h1 className="mb-4 font-headline text-4xl font-black uppercase tracking-tighter">PRODUCT NOT FOUND</h1>
        <Link to="/products" className="font-headline font-bold uppercase text-sm text-primary hover:underline">
          BACK TO CATALOG
        </Link>
      </div>
    );
  }

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link to="/products" className="mb-8 inline-flex items-center gap-2 text-sm font-headline font-bold uppercase tracking-wider text-secondary hover:text-on-surface transition-colors">
        <ArrowLeft className="h-4 w-4" />
        BACK TO CATALOG
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image section */}
        <div>
          <div className="aspect-[3/4] overflow-hidden bg-surface-container">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-secondary font-headline uppercase">
                NO IMAGE
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    const matchingVariant = product.variants?.find(
                      (v) => v.image_url === img.image
                    );
                    if (matchingVariant?.attributes.color) {
                      setSelectedColor(matchingVariant.attributes.color);
                    }
                  }}
                  className={`h-20 w-20 overflow-hidden border-2 ${
                    mainImage === img.image
                      ? 'border-on-surface'
                      : 'border-transparent hover:border-secondary'
                  }`}
                >
                  <img src={img.image} alt={img.alt_text} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-8">
          <div>
            <h1 className="mb-3 font-headline text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter">{product.name}</h1>
            <Link to={`/products?category=${product.category.slug}`}>
              <Badge variant="outline">{product.category.name}</Badge>
            </Link>
          </div>

          <div className="font-headline text-3xl md:text-4xl font-black text-primary">
            {formatCurrency(displayPrice)}
          </div>

          <p className="text-secondary font-body text-lg leading-relaxed">{product.description}</p>

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-bold font-headline uppercase tracking-widest">
                COLOR: <span className="text-secondary">{activeColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`border-2 px-4 py-2 text-sm font-headline font-bold uppercase transition-all duration-150 ${
                      activeColor === color
                        ? 'border-on-surface bg-on-surface text-surface'
                        : 'border-on-surface/20 text-on-surface hover:border-on-surface'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div>
              <label className="mb-3 block text-xs font-bold font-headline uppercase tracking-widest">
                SIZE: <span className="text-secondary">{activeSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] border-2 px-4 py-2 text-sm font-headline font-bold uppercase transition-all duration-150 ${
                      activeSize === size
                        ? 'border-on-surface bg-on-surface text-surface'
                        : 'border-on-surface/20 text-on-surface hover:border-on-surface'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock & SKU */}
          <div className="flex items-center gap-3">
            {displayStock > 0 ? (
              <Badge variant="success">IN STOCK ({displayStock})</Badge>
            ) : (
              <Badge variant="destructive">SOLD OUT</Badge>
            )}
            {selectedVariant && (
              <span className="text-xs text-secondary font-headline uppercase">SKU: {selectedVariant.sku}</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {displayStock > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-on-surface/10">
              <div>
                <label className="mb-2 block text-xs font-bold font-headline uppercase tracking-widest">QUANTITY</label>
                <div className="flex items-center border-2 border-on-surface w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-3 hover:bg-on-surface hover:text-surface transition-colors font-bold disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 font-headline font-bold border-x-2 border-on-surface min-w-[60px] text-center">
                    {String(quantity).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    disabled={quantity >= displayStock}
                    className="px-4 py-3 hover:bg-on-surface hover:text-surface transition-colors font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || !selectedVariant}
                className="w-full py-5 bg-primary-container text-white font-headline font-black text-xl uppercase tracking-tighter hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
              >
                {addToCart.isPending ? 'SECURING...' : 'SECURE'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
