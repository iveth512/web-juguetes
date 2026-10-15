'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getNewProducts, getFeaturedProducts } from '@/lib/api';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

interface ProductSectionInnerProps {
  title: string;
  bgAlt?: boolean;
  queryKey: string[];
  queryFn: () => Promise<unknown>;
}

function ProductSectionInner({
  title,
  bgAlt = false,
  queryKey,
  queryFn,
}: ProductSectionInnerProps) {
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
  });

  const results = (data as { results?: unknown[] } | undefined)?.results ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = results.slice(0, 8) as any[];

  return (
    <section
      className={cn(
        'py-12',
        bgAlt ? 'bg-[var(--color-bg-alt)]' : 'bg-[var(--color-bg)]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-[22px] font-bold text-[var(--color-text)]">
            {title}
          </h2>
          <Link
            href="/productos"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Ver todas &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}

export function NewProductsSection() {
  return (
    <ProductSectionInner
      title="Novedades"
      queryKey={['products', 'new']}
      queryFn={getNewProducts}
      bgAlt={false}
    />
  );
}

export function FeaturedProductsSection() {
  return (
    <ProductSectionInner
      title="Mas Vendidos"
      queryKey={['products', 'featured']}
      queryFn={getFeaturedProducts}
      bgAlt={true}
    />
  );
}
