import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  // Extract unique colors and sizes from variants
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

  // Auto-select first color/size on load
  const activeColor = selectedColor || colors[0] || null;
  const activeSize = selectedSize || sizes[0] || null;

  // Find the matching variant
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!product?.variants) return undefined;
    return product.variants.find((v) => {
      const colorMatch = !activeColor || v.attributes.color === activeColor;
      const sizeMatch = !activeSize || v.attributes.size === activeSize;
      return colorMatch && sizeMatch;
    });
  }, [product?.variants, activeColor, activeSize]);

  // Get image for selected color
  const mainImage = useMemo(() => {
    if (selectedVariant?.image_url) return selectedVariant.image_url;
    const primaryImg = product?.images?.find((img) => img.is_primary);
    return primaryImg?.image || product?.images?.[0]?.image || null;
  }, [selectedVariant, product?.images]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (!selectedVariant) {
      toast.error('Please select all options');
      return;
    }

    if (selectedVariant.stock === 0) {
      toast.error('This variant is out of stock');
      return;
    }

    addToCart.mutate(
      { variant_id: selectedVariant.id, quantity },
      {
        onSuccess: () => {
          toast.success(`${product!.name} added to cart`);
          setQuantity(1);
        },
        onError: () => {
          toast.error('Failed to add item to cart');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">Product not found</h1>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image section */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                No image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    // Find a color that matches this image
                    const matchingVariant = product.variants?.find(
                      (v) => v.image_url === img.image
                    );
                    if (matchingVariant?.attributes.color) {
                      setSelectedColor(matchingVariant.attributes.color);
                    }
                  }}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    mainImage === img.image
                      ? 'border-slate-900'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img.image} alt={img.alt_text} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info section */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">{product.name}</h1>
            <Link
              to={`/products?category=${product.category.slug}`}
              className="inline-block"
            >
              <Badge variant="secondary">{product.category.name}</Badge>
            </Link>
          </div>

          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(displayPrice)}
          </div>

          <div>
            <p className="text-slate-700">{product.description}</p>
          </div>

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <Label className="mb-3 block text-sm font-semibold">
                Color: <span className="font-normal text-slate-600">{activeColor}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      activeColor === color
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400'
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
              <Label className="mb-3 block text-sm font-semibold">
                Size: <span className="font-normal text-slate-600">{activeSize}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      activeSize === size
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400'
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
              <Badge variant="success">In Stock ({displayStock})</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {selectedVariant && (
              <span className="text-xs text-slate-400">SKU: {selectedVariant.sku}</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {displayStock > 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="mb-2 block text-sm font-semibold">
                  Quantity
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(displayStock, parseInt(e.target.value) || 1)))
                    }
                    className="w-24 text-center"
                    min="1"
                    max={displayStock}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    disabled={quantity >= displayStock}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={addToCart.isPending || !selectedVariant}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
