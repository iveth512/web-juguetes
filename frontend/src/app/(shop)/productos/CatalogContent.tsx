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
  PackageSearch,
} from 'lucide-react';
import { getProducts, getFranchises, getBrands } from '@/lib/api';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import {
  ProductFilters,
  ActiveFilterChips,
  type FilterValues,
} from '@/components/product/ProductFilters';

const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { label: 'Mas recientes', value: '-created_at' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Precio: mayor a menor', value: '-price' },
  { label: 'Mas populares', value: '-is_featured' },
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

function buildApiParams(filters: FilterValues): Record<string, string> {
  const params: Record<string, string> = {};

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

export function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);

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

  const apiParams = useMemo(() => buildApiParams(filters), [filters]);

  // Data fetching
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', apiParams],
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

  // Pagination
  const totalCount = productsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const startItem = totalCount > 0 ? (filters.page - 1) * DEFAULT_PAGE_SIZE + 1 : 0;
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-text)] font-medium">Todos los Productos</span>
      </nav>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">{sidebarContent}</aside>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute inset-y-0 left-0 w-[85vw] max-w-[300px] bg-[var(--color-bg)] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <h2 className="font-heading font-semibold text-[var(--color-text)]">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">{sidebarContent}</div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Mobile filter trigger */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-alt)] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>

              {totalCount > 0 && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Mostrando {startItem}-{endItem} de {totalCount} productos
                </p>
              )}
            </div>

            <select
              value={filters.ordering}
              onChange={(e) => updateFilters({ ordering: e.target.value, page: 1 })}
              className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          <ActiveFilterChips
            filters={filters}
            franchises={franchises}
            brands={brands}
            onRemove={removeFilter}
            onClearAll={clearAllFilters}
          />

          {/* Product grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-[var(--color-error)] mb-4" />
              <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
                Error al cargar productos
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Ocurrio un problema al obtener los productos. Intenta de nuevo.
              </p>
              <button
                type="button"
                onClick={() => refetchProducts()}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : productsData && productsData.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageSearch className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
              <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
                No encontramos productos con estos filtros
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Intenta ajustar los filtros o limpiarlos para ver todos los productos.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {productsData?.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-1 mt-8"
                  aria-label="Paginacion"
                >
                  <button
                    type="button"
                    disabled={filters.page <= 1}
                    onClick={() => updateFilters({ page: filters.page - 1 })}
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
                        onClick={() => updateFilters({ page: p })}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === filters.page
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
                    disabled={filters.page >= totalPages}
                    onClick={() => updateFilters({ page: filters.page + 1 })}
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
    </div>
  );
}
