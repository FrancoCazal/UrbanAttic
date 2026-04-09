import { useCategoryTree } from '@/hooks/useProducts';
import { CategoryTree } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/settings-context';

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
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-headline font-bold uppercase transition-colors ${
          isSelected
            ? 'text-primary'
            : hasChildren
              ? 'text-on-surface hover:text-primary'
              : 'text-on-surface/60 hover:text-on-surface'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isSelected && <span className="w-2 h-2 bg-primary flex-shrink-0"></span>}
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
  const t = useT();
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
    <div className="space-y-12">
      {/* Categories */}
      <section>
        <h3 className="font-headline font-bold uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary"></span> {t.catalog.categories}
        </h3>
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
      </section>

      {/* Price Range */}
      <section>
        <h3 className="font-headline font-bold uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-on-surface"></span> {t.catalog.priceRange}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold font-headline uppercase text-secondary">
              {t.catalog.minPrice}
            </label>
            <Input
              type="number"
              placeholder="$0"
              value={filters.min_price || ''}
              onChange={(e) => handlePriceChange('min_price', e.target.value)}
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold font-headline uppercase text-secondary">
              {t.catalog.maxPrice}
            </label>
            <Input
              type="number"
              placeholder="$100"
              value={filters.max_price || ''}
              onChange={(e) => handlePriceChange('max_price', e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>
      </section>

      {hasFilters && (
        <button
          onClick={handleClearFilters}
          className="w-full border-2 border-on-surface py-3 font-headline font-bold text-xs tracking-widest hover:bg-on-surface hover:text-background transition-all uppercase"
        >
          {t.catalog.resetFilters}
        </button>
      )}
    </div>
  );
}
