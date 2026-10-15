'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { useOnSaleProducts } from '@/hooks/useProducts';
import { useOffersCountdown } from '@/hooks/useOffersCountdown';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/utils';
import type { ProductListItem } from '@/types/product';

const DISCOUNT_TIERS = [
  { label: 'Todas las ofertas', min: 0, max: 100 },
  { label: 'Hasta 15%', min: 0, max: 15 },
  { label: '15% - 25%', min: 15, max: 25 },
  { label: '25% - 40%', min: 25, max: 40 },
  { label: 'Más de 40%', min: 40, max: 100 },
];

const SORT_OPTIONS = [
  { label: 'Mayor descuento', value: '-discount' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Precio: mayor a menor', value: '-price' },
  { label: 'Mas recientes', value: '-created_at' },
];

const ITEMS_PER_PAGE = 24;

function formatCountdown(diff: number) {
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function BigCountdownTimer() {
  const remaining = useOffersCountdown(1000);

  if (remaining === null) {
    return <div className="flex gap-4 justify-center" />;
  }

  const timeLeft = formatCountdown(remaining);

  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {[
        { value: timeLeft.days, label: 'Días' },
        { value: timeLeft.hours, label: 'Horas' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Seg' },
      ].map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 min-w-[64px] sm:min-w-[80px]"
        >
          <span className="font-heading text-2xl sm:text-4xl font-bold text-[var(--color-primary)]">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs text-white/70 uppercase mt-0.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function getSavings(product: ProductListItem): number {
  if (!product.compare_price) return 0;
  return parseFloat(product.compare_price) - parseFloat(product.base_price);
}

export function OffersContent() {
  const { data, isLoading } = useOnSaleProducts();
  const [activeTier, setActiveTier] = useState(0);
  const [sort, setSort] = useState('-discount');
  const [page, setPage] = useState(1);

  const allProducts = useMemo(() => data?.results ?? [], [data]);

  const filteredProducts = useMemo(() => {
    const tier = DISCOUNT_TIERS[activeTier];
    const products = allProducts.filter((p) => {
      const pct = p.sale_percentage ?? 0;
      if (activeTier === 0) return true;
      return pct >= tier.min && pct <= tier.max;
    });

    // Sort
    if (sort === '-discount') {
      products.sort((a, b) => (b.sale_percentage ?? 0) - (a.sale_percentage ?? 0));
    } else if (sort === 'price') {
      products.sort((a, b) => parseFloat(a.base_price) - parseFloat(b.base_price));
    } else if (sort === '-price') {
      products.sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price));
    } else if (sort === '-created_at') {
      products.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return products;
  }, [allProducts, activeTier, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Solo esta semana
          </span>
          <h1 className="font-heading font-extrabold text-[32px] sm:text-[40px] text-white mb-3">
            Ofertas de la semana
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-6">
            Funko Pop! originales con descuento por tiempo limitado. Aprovecha antes de que se agoten.
          </p>
          <BigCountdownTimer />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] mb-6">
          <Link
            href="/"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--color-text)] font-medium">Ofertas de la semana</span>
        </nav>

        {/* Discount tier chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DISCOUNT_TIERS.map((tier, i) => (
            <button
              key={tier.label}
              type="button"
              onClick={() => {
                setActiveTier(i);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                i === activeTier
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            {filteredProducts.length} productos en oferta
          </p>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="w-16 h-16 text-[var(--color-text-muted)] mb-4 opacity-40" />
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
              No hay ofertas en este rango
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Intenta con otro rango de descuento.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => {
                const savings = getSavings(product);
                return (
                  <div key={product.id} className="flex flex-col">
                    <ProductCard product={product} />
                    {savings > 0 && (
                      <div className="mt-1 px-2">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3" />
                          Ahorras {formatPrice(savings)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-1 mt-8"
                aria-label="Paginacion"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((p, i) =>
                  p === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-sm text-[var(--color-text-muted)]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Pagina siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
