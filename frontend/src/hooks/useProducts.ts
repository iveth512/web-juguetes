'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getNewProducts,
  getFeaturedProducts,
  getOnSaleProducts,
  getCategories,
  getFranchises,
} from '@/lib/api';

export function useNewProducts() {
  return useQuery({ queryKey: ['products', 'new'], queryFn: getNewProducts });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: getFeaturedProducts,
  });
}

export function useOnSaleProducts() {
  return useQuery({
    queryKey: ['products', 'on-sale'],
    queryFn: getOnSaleProducts,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

export function useFranchises() {
  return useQuery({ queryKey: ['franchises'], queryFn: getFranchises });
}
