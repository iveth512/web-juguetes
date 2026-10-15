'use client';

import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';

export function CartRecommendations() {
  const { items } = useCart();

  // Get franchise from first cart item (if available)
  // We don't have franchise in CartItem, so we fetch general recommendations
  const cartProductIds = items.map((i) => i.productId);

  const { data } = useQuery({
    queryKey: ['cart-recommendations'],
    queryFn: () => getProducts({ page_size: '8' }),
    enabled: items.length > 0,
  });

  if (items.length === 0 || !data?.results?.length) {
    return null;
  }

  // Filter out products already in cart and limit to 4
  const recommendations = data.results
    .filter((p) => !cartProductIds.includes(p.id))
    .slice(0, 4);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-heading text-xl font-bold text-[var(--color-text)] mb-4">
        Te puede interesar
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
