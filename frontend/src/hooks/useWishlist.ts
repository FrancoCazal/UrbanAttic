import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { PaginatedResponse, WishlistItem } from '@/lib/types';
import { useUser } from '@/hooks/useAuth';

export function useWishlist() {
  const { data: user } = useUser();
  return useQuery<PaginatedResponse<WishlistItem>>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist/');
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  });
}

export function useIsInWishlist(slug: string) {
  const { data } = useWishlist();
  return data?.results.some((item) => item.product.slug === slug) ?? false;
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await api.post(`/wishlist/toggle/${slug}/`, {});
      return data as { in_wishlist: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
