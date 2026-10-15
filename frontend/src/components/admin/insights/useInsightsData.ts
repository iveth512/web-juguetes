'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminListOrders, adminListProducts, getSalesByProduct } from '@/lib/api';
import type { AdminOrder, AdminProduct, DateRange } from '@/types/admin';
import { previousRange } from './compute';

// 40 pages x 24 = 960 orders; past that the analysis says it is partial.
const MAX_ORDER_PAGES = 40;
const MAX_PRODUCT_PAGES = 30;

async function allOrders(range: DateRange): Promise<{ orders: AdminOrder[]; total: number; capped: boolean }> {
  const orders: AdminOrder[] = [];
  let page = 1;
  let total = 0;
  for (;;) {
    const data = await adminListOrders({ ...range, estado: 'ventas', page });
    total = data.count;
    orders.push(...data.results);
    if (!data.next) return { orders, total, capped: false };
    if (page >= MAX_ORDER_PAGES) return { orders, total, capped: true };
    page += 1;
  }
}

async function allProducts(): Promise<AdminProduct[]> {
  const products: AdminProduct[] = [];
  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const data = await adminListProducts({ estado: 'activos', page });
    products.push(...data.results);
    if (!data.next) break;
  }
  return products;
}

export function useInsightsData(range: DateRange) {
  const prev = previousRange(range);
  const prevOrders = useQuery({ queryKey: ['insights', 'orders', prev], queryFn: () => allOrders(prev) });
  // The endpoint caps the ranking at 50; the remainder is derived from order subtotals.
  const byProduct = useQuery({
    queryKey: ['insights', 'by-product', range],
    queryFn: () => getSalesByProduct({ ...range, limite: 50 }),
    placeholderData: keepPreviousData,
  });
  const orders = useQuery({ queryKey: ['insights', 'orders', range], queryFn: () => allOrders(range), placeholderData: keepPreviousData });
  const products = useQuery({ queryKey: ['insights', 'products'], queryFn: allProducts, staleTime: 5 * 60 * 1000 });

  const queries = [byProduct, orders, products];
  return {
    prevOrders: prevOrders.data,
    byProduct: byProduct.data,
    orders: orders.data,
    products: products.data,
    isLoading: queries.some((q) => q.isPending),
    isFetching: queries.some((q) => q.isFetching),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => q.error && q.refetch()),
  };
}
