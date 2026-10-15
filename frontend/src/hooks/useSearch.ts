'use client';

import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '@/lib/api';

export function useSearch(query: string, page: number = 1) {
  return useQuery({
    queryKey: ['search', query, page],
    queryFn: () => searchProducts(query, page),
    enabled: query.length >= 2,
  });
}
