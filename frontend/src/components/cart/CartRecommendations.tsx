'use client';

import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { getProduct, getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';

const MAX_RECOMMENDATIONS = 4;

export function CartRecommendations() {
  const { items } = useCart();
  const cartProductIds = new Set(items.map((i) => i.productId));
  // Cart lines don't store the franchise; the latest added item's detail has it.
  const anchorSlug = items.at(-1)?.slug;

  const { data: anchor, isFetched: anchorFetched } = useQuery({
    queryKey: ['product', anchorSlug],
    queryFn: () => getProduct(anchorSlug as string),
    enabled: Boolean(anchorSlug),
    staleTime: 5 * 60 * 1000,
  });
  const franchiseSlug = anchor?.franchise.slug;

  const { data: sameFranchise } = useQuery({
    queryKey: ['cart-recommendations', 'franchise', franchiseSlug],
    queryFn: () => getProducts({ franchise: franchiseSlug as string, page_size: '12' }),
    enabled: Boolean(franchiseSlug),
  });

  const { data: general } = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: () => getProducts({ page_size: '12' }),
    enabled: items.length > 0 && anchorFetched,
  });

  if (items.length === 0) return null;

  const pool = [...(sameFranchise?.results ?? []), ...(general?.results ?? [])];
  const seen = new Set<string>();
  const recommendations = pool
    .filter((p) => {
      if (cartProductIds.has(p.id) || seen.has(p.id) || p.stock === 0) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, MAX_RECOMMENDATIONS);

  if (recommendations.length === 0) return null;

  const franchiseIds = new Set(sameFranchise?.results.map((p) => p.id));
  const fromFranchise = Boolean(anchor) && recommendations.every((p) => franchiseIds.has(p.id));

  return (
    <section className="mt-16" aria-labelledby="cart-recommendations-title">
      <h2 id="cart-recommendations-title" className="type-section mb-6 text-[var(--color-text)]">
        {fromFranchise ? `Más de ${anchor?.franchise.name}` : 'Te puede interesar'}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
