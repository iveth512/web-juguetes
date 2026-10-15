'use client';

import Link from 'next/link';
import { useOffersCountdown } from '@/hooks/useOffersCountdown';
import { useOnSaleProducts } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

function describeRemaining(ms: number) {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} ${days === 1 ? 'día' : 'días'} y ${hours} h`;
  if (hours > 0) return `${hours} h y ${minutes} min`;
  return `${minutes} min`;
}

function OffersDeadline() {
  const remaining = useOffersCountdown(60_000);
  return (
    <p className="mt-3 text-base text-[var(--color-stage-muted)]" aria-live="off">
      Cambian cada lunes.{' '}
      {remaining !== null && (
        <span className="font-semibold text-[var(--color-stage-text)]">
          Quedan {describeRemaining(remaining)}.
        </span>
      )}
    </p>
  );
}

export function OffersSection() {
  const { data, isLoading } = useOnSaleProducts();
  const products = data?.results?.slice(0, 4) ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="on-dark grain bg-[var(--color-secondary)] py-16 md:py-24 [--color-bg-alt:#3B2A80] [--color-bg:var(--color-secondary)] dark:[--color-bg-alt:var(--color-stage-raised)]">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-10">
          <div className="max-w-xl">
            <h2 className="type-section misreg [--misreg-ink:color-mix(in_srgb,var(--color-primary)_80%,transparent)]">Ofertas de la semana</h2>
            <OffersDeadline />
          </div>
          <Link
            href="/ofertas"
            className="inline-flex min-h-11 items-center text-base font-semibold underline decoration-[var(--color-accent)] decoration-2 underline-offset-[6px] hover:text-[var(--color-accent)]"
          >
            Ver todas las ofertas
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
