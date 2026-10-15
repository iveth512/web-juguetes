'use client';

import Link from 'next/link';
import { useOffersCountdown } from '@/hooks/useOffersCountdown';
import { useOnSaleProducts } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

function formatCountdown(diff: number) {
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

function CountdownTimer() {
  const remaining = useOffersCountdown(60_000);

  if (remaining === null) {
    return <div className="flex gap-3" />;
  }

  const timeLeft = formatCountdown(remaining);

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.days, label: 'días' },
        { value: timeLeft.hours, label: 'hrs' },
        { value: timeLeft.minutes, label: 'min' },
      ].map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center bg-white/10 rounded-lg px-3 py-2 min-w-[52px]"
        >
          <span className="font-heading text-xl font-bold text-white">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-white/70 uppercase">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export function OffersSection() {
  const { data, isLoading } = useOnSaleProducts();
  const products = data?.results?.slice(0, 4) ?? [];

  return (
    <section className="py-12 bg-[var(--color-secondary)]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="font-heading text-[22px] font-bold text-white">
            <Link href="/ofertas" className="hover:text-[var(--color-primary)] transition-colors">
              Ofertas de la semana
            </Link>
          </h2>
          <CountdownTimer />
        </div>

        {/* Product grid */}
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
