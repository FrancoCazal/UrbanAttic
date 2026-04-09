import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image || null;

  return (
    <Link to={`/products/${product.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="p-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                No image
              </div>
            )}
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-slate-900">{product.name}</h3>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(product.price)}
              </p>
              {product.stock > 0 ? (
                <Badge variant="success" className="text-xs">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            View Options
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
