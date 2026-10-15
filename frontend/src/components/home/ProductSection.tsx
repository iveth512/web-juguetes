'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getNewProducts, getFeaturedProducts } from '@/lib/api';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import type { PaginatedResponse, ProductListItem } from '@/types/product';

interface ProductSectionInnerProps {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  layout: 'grid' | 'row';
  queryKey: string[];
  queryFn: () => Promise<PaginatedResponse<ProductListItem>>;
}

function ProductSectionInner({
  title,
  description,
  href,
  linkLabel,
  layout,
  queryKey,
  queryFn,
}: ProductSectionInnerProps) {
  const { data, isLoading } = useQuery({ queryKey, queryFn });
  const products = data?.results?.slice(0, 8) ?? [];

  if (!isLoading && products.length === 0) return null;

  const isRow = layout === 'row';

  return (
    <section className={cn('py-16 md:py-24', isRow ? 'bg-[var(--color-bg-alt)]' : 'bg-[var(--color-bg)]')}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-10">
          <div className="max-w-xl">
            <h2 className="type-section text-[var(--color-text)]">{title}</h2>
            <p className="mt-3 text-base text-[var(--color-text-muted)]">{description}</p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-base font-semibold text-[var(--color-primary-text)] underline decoration-2 underline-offset-[6px] hover:decoration-[var(--color-primary)]"
          >
            {linkLabel}
          </Link>
        </div>

        <div
          className={cn(
            isRow
              ? '-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 [&>*]:w-[46%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[31%] lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 lg:overflow-visible lg:px-0 lg:pb-0 lg:[&>*]:w-auto'
              : 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6'
          )}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

export function NewProductsSection() {
  return (
    <ProductSectionInner
      title="Recién llegados"
      description="Las últimas cajas que entraron a la vitrina."
      href="/novedades"
      linkLabel="Ver todas las novedades"
      layout="grid"
      queryKey={['products', 'new']}
      queryFn={getNewProducts}
    />
  );
}

export function FeaturedProductsSection() {
  return (
    <ProductSectionInner
      title="Destacados"
      description="Piezas que elegimos para empezar o completar tu colección."
      href="/productos"
      linkLabel="Ver catálogo completo"
      layout="row"
      queryKey={['products', 'featured']}
      queryFn={getFeaturedProducts}
    />
  );
}
