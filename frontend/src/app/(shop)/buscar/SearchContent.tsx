'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useFranchises } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

const SORT_OPTIONS = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Precio: mayor a menor', value: '-price' },
  { label: 'Mas recientes', value: '-created_at' },
];

const DEFAULT_PAGE_SIZE = 24;

export function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const [inputValue, setInputValue] = useState(query);
  const [sort, setSort] = useState('relevance');

  const { data, isLoading, isError } = useSearch(query, pageParam);
  const { data: franchises = [] } = useFranchises();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim().length >= 2) {
        router.push(`/buscar?q=${encodeURIComponent(inputValue.trim())}`);
      }
    },
    [inputValue, router]
  );

  const sortedResults = useMemo(() => {
    if (!data?.results) return [];
    const results = [...data.results];
    if (sort === 'price') {
      results.sort((a, b) => parseFloat(a.base_price) - parseFloat(b.base_price));
    } else if (sort === '-price') {
      results.sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price));
    } else if (sort === '-created_at') {
      results.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return results;
  }, [data?.results, sort]);

  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      params.set('q', query);
      if (page > 1) params.set('page', String(page));
      router.push(`/buscar?${params.toString()}`);
    },
    [query, router]
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pageParam > 3) pages.push('ellipsis');
      const start = Math.max(2, pageParam - 1);
      const end = Math.min(totalPages - 1, pageParam + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pageParam < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, pageParam]);

  return (
    <div>
      {/* Search header */}
      <div className="bg-[var(--color-bg-alt)] py-8">
        <div className="max-w-7xl mx-auto px-4">
          {query ? (
            <>
              <h1 className="font-heading font-extrabold text-2xl text-[var(--color-text)] mb-1">
                Resultados para{' '}
                <span className="text-[var(--color-primary)]">
                  &ldquo;{query}&rdquo;
                </span>
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                {totalCount} productos encontrados
              </p>
            </>
          ) : (
            <h1 className="font-heading font-extrabold text-2xl text-[var(--color-text)] mb-4">
              Buscar productos
            </h1>
          )}

          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Buscar juguetes, figuras, coleccionables..."
                className="w-full pl-12 pr-4 py-3.5 text-base border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* No query state */}
        {!query || query.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-[var(--color-text-muted)] mb-4 opacity-40" />
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
              Escribe al menos 2 caracteres para buscar
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Explora nuestras franquicias populares
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {franchises.slice(0, 8).map((franchise) => (
                <Link
                  key={franchise.id}
                  href={`/productos?franchise=${franchise.slug}`}
                  className="px-3 py-1.5 text-sm font-medium bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {franchise.name}
                </Link>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
              Error al buscar
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Ocurrio un problema. Intenta de nuevo.
            </p>
          </div>
        ) : sortedResults.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-[var(--color-text-muted)] mb-4 opacity-40" />
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
              No encontramos resultados para &ldquo;{query}&rdquo;
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Intenta con otro término o explora nuestras franquicias
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {franchises.slice(0, 8).map((franchise) => (
                <Link
                  key={franchise.id}
                  href={`/productos?franchise=${franchise.slug}`}
                  className="px-3 py-1.5 text-sm font-medium bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {franchise.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Sort toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--color-text-muted)]">
                {totalCount} resultados
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedResults.map((product) => (
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
                  disabled={pageParam <= 1}
                  onClick={() => goToPage(pageParam - 1)}
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
                      onClick={() => goToPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === pageParam
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
                  disabled={pageParam >= totalPages}
                  onClick={() => goToPage(pageParam + 1)}
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
