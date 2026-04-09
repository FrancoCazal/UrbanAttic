import { useCategoryTree } from '@/hooks/useProducts';
import { CategoryTree } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    category?: string;
    min_price?: number;
    max_price?: number;
  };
  onFilterChange: (filters: { category?: string; min_price?: number; max_price?: number }) => void;
}

interface CategoryNodeProps {
  node: CategoryTree;
  selectedSlug?: string;
  onSelect: (slug: string) => void;
  depth?: number;
}

function CategoryNode({ node, selectedSlug, onSelect, depth = 0 }: CategoryNodeProps) {
  const isSelected = selectedSlug === node.slug;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onSelect(node.slug)}
        className={`flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm transition-colors ${
          isSelected
            ? 'bg-slate-900 text-white font-medium'
            : hasChildren
              ? 'font-semibold text-slate-900 hover:bg-slate-100'
              : 'text-slate-600 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {!hasChildren && <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-40" />}
        <span>{node.name}</span>
      </button>
      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const { data: tree, isLoading } = useCategoryTree();

  const handleCategoryChange = (slug: string) => {
    const newCategory = filters.category === slug ? undefined : slug;
    onFilterChange({ ...filters, category: newCategory });
  };

  const handlePriceChange = (field: 'min_price' | 'max_price', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFilterChange({ ...filters, [field]: numValue });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = filters.category || filters.min_price || filters.max_price;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-3 block text-sm font-semibold">Categories</Label>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree?.map((root) => (
                <CategoryNode
                  key={root.id}
                  node={root}
                  selectedSlug={filters.category}
                  onSelect={handleCategoryChange}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="mb-3 block text-sm font-semibold">Price Range</Label>
          <div className="space-y-3">
            <div>
              <Label htmlFor="min-price" className="mb-1 block text-xs text-slate-600">
                Min Price
              </Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0"
                value={filters.min_price || ''}
                onChange={(e) => handlePriceChange('min_price', e.target.value)}
                min="0"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="mb-1 block text-xs text-slate-600">
                Max Price
              </Label>
              <Input
                id="max-price"
                type="number"
                placeholder="1000"
                value={filters.max_price || ''}
                onChange={(e) => handlePriceChange('max_price', e.target.value)}
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <Button variant="outline" className="w-full" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
