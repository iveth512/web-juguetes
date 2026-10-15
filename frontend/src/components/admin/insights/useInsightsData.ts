'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminListProducts, getDashboardInsights, getDashboardSummary } from '@/lib/api';
import type { AdminProduct, DateRange } from '@/types/admin';
import { previousRange } from './compute';

const MAX_PRODUCT_PAGES = 30;

// Only needed for the total value of the stock on hand, which the dormant share is measured against.
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
  const insights = useQuery({
    queryKey: ['insights', 'data', range],
    queryFn: () => getDashboardInsights(range),
    placeholderData: keepPreviousData,
  });
  const summary = useQuery({
    queryKey: ['insights', 'summary', range],
    queryFn: () => getDashboardSummary(range),
    placeholderData: keepPreviousData,
  });
  // The comparison is a nice-to-have: its failure must not block the page.
  const prevSummary = useQuery({ queryKey: ['insights', 'summary', prev], queryFn: () => getDashboardSummary(prev) });
  const products = useQuery({ queryKey: ['insights', 'products'], queryFn: allProducts, staleTime: 5 * 60 * 1000 });

  const queries = [insights, summary, products];
  return {
    insights: insights.data,
    summary: summary.data,
    prevSummary: prevSummary.data,
    products: products.data,
    isFetching: queries.some((q) => q.isFetching),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => q.error && q.refetch()),
  };
}
