'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/api';

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  });

  const wishlistIds = new Set(wishlist.map((item) => item.id));

  return {
    wishlist,
    isLoading,
    isInWishlist: (productId: string) => wishlistIds.has(productId),
    count: wishlist.length,
  };
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addToWishlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return {
    add: addMutation.mutate,
    remove: removeMutation.mutate,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
