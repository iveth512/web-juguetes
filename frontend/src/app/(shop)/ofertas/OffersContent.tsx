'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useOnSaleProducts } from '@/hooks/useProducts';
import { useOffersCountdown } from '@/hooks/useOffersCountdown';
import { Sticker } from '@/components/ui/Sticker';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { formatPrice } from '@/lib/utils';
import type { ProductListItem } from '@/types/product';

// Ranges are (min, max] so a 15% product falls in exactly one tier.
const DISCOUNT_TIERS = [
  { label: 'Todas', min: -1, max: 100 },
  { label: 'Hasta 15%', min: -1, max: 15 },
  { label: '16% a 25%', min: 15, max: 25 },
  { label: '26% a 40%', min: 25, max: 40 },
  { label: 'Más de 40%', min: 40, max: 100 },
];

const SORT_OPTIONS = [
  { label: 'Mayor descuento', value: '-discount' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Precio: mayor a menor', value: '-price' },
  { label: 'Más recientes', value: '-created_at' },
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
  const timeLeft = formatCountdown(remaining ?? 0);
  const units = [
    { value: timeLeft.days, label: 'días' },
    { value: timeLeft.hours, label: 'horas' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'seg' },
  ];

  return (
    <div>
      <p className="text-base text-[var(--color-stage-muted)]">Terminan en</p>
      <div
        className="mt-2 flex gap-2 sm:gap-3"
        role="timer"
        aria-label={
          remaining === null
            ? 'Calculando tiempo restante'
            : `${timeLeft.days} días, ${timeLeft.hours} horas y ${timeLeft.minutes} minutos`
        }
      >
        {units.map((unit) => (
          <div
            key={unit.label}
            className="flex flex-col items-center rounded-xl bg-[var(--color-stage-raised)] px-3 py-3 min-w-[68px] sm:min-w-[84px]"
          >
            <span className="type-section text-[var(--color-primary)] tabular-nums">
              {remaining === null ? '--' : String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-sm text-[var(--color-stage-muted)]">{unit.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-[var(--color-stage-muted)]">
        El domingo a las 11:59 p. m., hora de Colombia.
      </p>
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
      return pct > tier.min && pct <= tier.max;
    });

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

  const availableTiers = useMemo(
    () =>
      DISCOUNT_TIERS.map((tier, index) => ({ ...tier, index })).filter(
        (tier) =>
          tier.index === 0 ||
          allProducts.some((p) => {
            const pct = p.sale_percentage ?? 0;
            return pct > tier.min && pct <= tier.max;
          })
      ),
    [allProducts]
  );

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
    <div className="pb-16 md:pb-24">
      <section className="grain bg-[var(--color-stage)] text-[var(--color-stage-text)]">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 md:pb-16">
          <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-1.5 text-sm text-[var(--color-stage-muted)]"
          >
            <Link href="/" className="hover:text-[var(--color-stage-text)] transition-colors">
              Inicio
            </Link>
            <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[var(--color-stage-text)] font-medium" aria-current="page">
              Ofertas
            </span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="type-page">Ofertas de la semana</h1>
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[var(--color-stage-text)]">
                Funko Pop! originales con descuento hasta el domingo. Las unidades son limitadas y
                el precio vuelve a la normalidad cuando termina la semana.
              </p>
            </div>
            <BigCountdownTimer />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pt-10 md:pt-12">
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          {availableTiers.length > 2 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por descuento">
              {availableTiers.map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  aria-pressed={tier.index === activeTier}
                  onClick={() => {
                    setActiveTier(tier.index);
                    setPage(1);
                  }}
                  className={`min-h-11 px-5 text-sm font-semibold rounded-full transition-colors ${
                    tier.index === activeTier
                      ? 'bg-[var(--color-secondary)] text-white'
                      : 'bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center justify-between gap-4 md:justify-end">
            <p className="text-sm text-[var(--color-text-muted)] tabular-nums" aria-live="polite">
              {isLoading
                ? 'Cargando ofertas…'
                : filteredProducts.length === 1
                  ? '1 producto en oferta'
                  : `${filteredProducts.length} productos en oferta`}
            </p>
            <select
              value={sort}
              aria-label="Ordenar ofertas"
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="min-h-11 px-3 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="grain relative mt-4 flex max-w-2xl flex-col items-start rounded-2xl bg-[var(--color-showcase)] px-6 pb-8 pt-12 text-[var(--color-showcase-text)] md:px-10">
            <Sticker tone="green" tilt={-6} className="absolute -top-4 -left-2 z-10 text-xl md:text-2xl">
              Se agotó la magia
            </Sticker>
            <h2 className="text-2xl font-semibold mb-2">
              {allProducts.length === 0
                ? 'Esta semana no hay ofertas activas'
                : 'No hay ofertas en este rango'}
            </h2>
            <p className="text-base leading-relaxed text-[var(--color-showcase-muted)] mb-6">
              {allProducts.length === 0
                ? 'Explora el catálogo completo mientras llega la próxima selección.'
                : 'Prueba con otro rango de descuento.'}
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
              {paginatedProducts.map((product) => {
                const savings = getSavings(product);
                return (
                  <div key={product.id} className="flex flex-col">
                    <ProductCard product={product} />
                    {savings > 0 && (
                      <p className="mt-1 text-sm font-semibold text-[var(--color-text)] tabular-nums">
                        Ahorras {formatPrice(savings)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Paginación">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft strokeWidth={1.75} className="w-5 h-5" />
                </button>

                {pageNumbers.map((p, i) =>
                  p === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-sm text-[var(--color-text-muted)]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === page ? 'page' : undefined}
                      className={`min-w-11 h-11 rounded-full text-sm font-semibold tabular-nums transition-colors ${
                        p === page
                          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'
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
                  className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight strokeWidth={1.75} className="w-5 h-5" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
