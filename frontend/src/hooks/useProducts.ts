import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Product, ProductDetail, Category, CategoryTree, PaginatedResponse } from '@/lib/types';

interface ProductFilters {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.min_price) params.append('min_price', filters.min_price.toString());
      if (filters.max_price) params.append('max_price', filters.max_price.toString());
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const { data } = await api.get(`/products/?${params.toString()}`);
      return data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery<ProductDetail>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}/`);
      return data;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories/');
      return data.results ?? data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategoryTree() {
  return useQuery<CategoryTree[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const { data } = await api.get('/categories/tree/');
      return data.results ?? data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
