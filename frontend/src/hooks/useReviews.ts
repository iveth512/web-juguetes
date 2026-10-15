'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviews, createReview, deleteReview } from '@/lib/api';

export function useReviews(productSlug: string) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productSlug],
    queryFn: () => getReviews(productSlug),
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100
      : 0,
  }));

  return { reviews, isLoading, averageRating, distribution, count: reviews.length };
}

export function useCreateReview(productSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] });
    },
  });
}

export function useDeleteReview(productSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] });
    },
  });
}
