'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  AlertCircle,
} from 'lucide-react';
import { getProducts, getFranchises, getBrands } from '@/lib/api';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { Sticker } from '@/components/ui/Sticker';
import {
  ProductFilters,
  ActiveFilterChips,
  type FilterValues,
} from '@/components/product/ProductFilters';

const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { label: 'Más recientes', value: '-created_at' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Precio: mayor a menor', value: '-price' },
  { label: 'Destacados primero', value: '-is_featured' },
];

function parseFiltersFromParams(searchParams: URLSearchParams): FilterValues {
  return {
    franchise: searchParams.getAll('franchise'),
    brand: searchParams.getAll('brand'),
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    ordering: searchParams.get('ordering') || '-created_at',
    page: parseInt(searchParams.get('page') || '1', 10),
  };
}

function buildSearchParams(filters: FilterValues): URLSearchParams {
  const params = new URLSearchParams();
  filters.franchise.forEach((v) => params.append('franchise', v));
  filters.brand.forEach((v) => params.append('brand', v));
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);
  if (filters.in_stock) params.set('in_stock', 'true');
  if (filters.ordering && filters.ordering !== '-created_at') {
    params.set('ordering', filters.ordering);
  }
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

function buildApiParams(
  filters: FilterValues,
  categorySlug: string
): Record<string, string> {
  const params: Record<string, string> = {};

  params.category = categorySlug;

  if (filters.franchise.length) params.franchise = filters.franchise.join(',');
  if (filters.brand.length) params.brand = filters.brand.join(',');
  if (filters.min_price) params.min_price = filters.min_price;
  if (filters.max_price) params.max_price = filters.max_price;
  if (filters.in_stock) params.in_stock = 'true';
  params.ordering = filters.ordering || '-created_at';
  params.page = String(filters.page);
  params.page_size = String(DEFAULT_PAGE_SIZE);

  return params;
}

interface CategoryContentProps {
  categorySlug: string;
  categoryName: string;
  categoryDescription?: string;
}

export function CategoryContent({
  categorySlug,
  categoryName,
  categoryDescription,
}: CategoryContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  );

  const updateFilters = useCallback(
    (partial: Partial<FilterValues>) => {
      const next = { ...filters, ...partial };
      const params = buildSearchParams(next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname, router]
  );

  const clearAllFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  const removeFilter = useCallback(
    (key: string, value?: string) => {
      const next = { ...filters };
      if (key === 'franchise' || key === 'brand') {
        next[key] = next[key].filter((v) => v !== value);
      } else if (key === 'min_price') {
        next.min_price = '';
      } else if (key === 'max_price') {
        next.max_price = '';
      } else if (key === 'in_stock') {
        next.in_stock = false;
      }
      next.page = 1;
      const params = buildSearchParams(next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname, router]
  );

  const apiParams = useMemo(
    () => buildApiParams(filters, categorySlug),
    [filters, categorySlug]
  );

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', 'category', categorySlug, apiParams],
    queryFn: () => getProducts(apiParams),
  });

  const { data: franchises = [] } = useQuery({
    queryKey: ['franchises'],
    queryFn: getFranchises,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 5 * 60 * 1000,
  });

  const totalCount = productsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const startItem =
    totalCount > 0 ? (filters.page - 1) * DEFAULT_PAGE_SIZE + 1 : 0;
  const endItem = Math.min(filters.page * DEFAULT_PAGE_SIZE, totalCount);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (filters.page > 3) pages.push('ellipsis');
      const start = Math.max(2, filters.page - 1);
      const end = Math.min(totalPages - 1, filters.page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (filters.page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, filters.page]);

  const sidebarContent = (
    <ProductFilters
      franchises={franchises}
      brands={brands}
      filters={filters}
      onFilterChange={updateFilters}
      onClearAll={clearAllFilters}
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
          Inicio
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <Link
          href="/categorias"
          className="hover:text-[var(--color-primary-text)] transition-colors"
        >
          Categorías
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          {categoryName}
        </span>
      </nav>

      <header className="mt-6 mb-8 md:mb-10">
        <h1 className="type-page text-[var(--color-text)]">{categoryName}</h1>
        {categoryDescription && (
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[var(--color-text)]">
            {categoryDescription}
          </p>
        )}
        <p className="mt-3 text-base text-[var(--color-text-muted)] tabular-nums" aria-live="polite">
          {productsLoading
            ? 'Cargando productos…'
            : totalCount === 1
              ? '1 producto'
              : `${totalCount} productos`}
          {totalPages > 1 && !productsLoading && (
            <>, mostrando del {startItem} al {endItem}</>
          )}
        </p>
      </header>

      <div className="flex gap-8 lg:gap-10">
        <aside className="hidden lg:block w-[260px] shrink-0" aria-label="Filtros">
          {sidebarContent}
        </aside>

        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[88vw] max-w-[340px] bg-[var(--color-bg)] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-[var(--color-bg)]">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Cerrar filtros"
                  className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
                >
                  <X strokeWidth={1.75} className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 pb-6">{sidebarContent}</div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 min-h-11 px-4 text-sm font-semibold rounded-full bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            >
              <SlidersHorizontal strokeWidth={1.75} className="w-4 h-4" />
              Filtros
            </button>

            <label className="ml-auto flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span className="hidden sm:inline">Ordenar por</span>
              <select
                value={filters.ordering}
                onChange={(e) => updateFilters({ ordering: e.target.value, page: 1 })}
                aria-label="Ordenar por"
                className="min-h-11 px-3 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ActiveFilterChips
            filters={filters}
            franchises={franchises}
            brands={brands}
            onRemove={removeFilter}
            onClearAll={clearAllFilters}
          />

          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-start py-16 max-w-[52ch]">
              <AlertCircle strokeWidth={1.75} className="w-8 h-8 text-[var(--color-error)] mb-4" />
              <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                No pudimos cargar los productos
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-text-muted)] mb-6">
                Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, escríbenos desde la
                página de contacto.
              </p>
              <button
                type="button"
                onClick={() => refetchProducts()}
                className="inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : productsData && productsData.results.length === 0 ? (
            <div className="grain relative mt-4 flex max-w-2xl flex-col items-start rounded-2xl bg-[var(--color-showcase)] px-6 pb-8 pt-12 text-[var(--color-showcase-text)] md:px-10">
              <Sticker tone="orange" tilt={-6} className="absolute -top-4 -left-2 z-10 text-xl md:text-2xl">
                Repisa vacía
              </Sticker>
              <h2 className="text-2xl font-semibold mb-2">
                Ningún producto de esta categoría coincide con tus filtros
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-showcase-muted)] mb-6">
                Quita algún filtro o amplía el rango de precio para ver más figuras.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {productsData?.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  onChange={(page) => updateFilters({ page })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  pageNumbers: (number | 'ellipsis')[];
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, pageNumbers, onChange }: PaginationProps) {
  const arrowClass =
    'flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Paginación">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={arrowClass}
        aria-label="Página anterior"
      >
        <ChevronLeft strokeWidth={1.75} className="w-5 h-5" />
      </button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-[var(--color-text-muted)]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
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
        onClick={() => onChange(page + 1)}
        className={arrowClass}
        aria-label="Página siguiente"
      >
        <ChevronRight strokeWidth={1.75} className="w-5 h-5" />
      </button>
    </nav>
  );
}
