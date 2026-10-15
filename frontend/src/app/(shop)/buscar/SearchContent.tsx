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
  { label: 'Más recientes', value: '-created_at' },
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

  const rawResults = data?.results;
  const sortedResults = useMemo(() => {
    if (!rawResults) return [];
    const results = [...rawResults];
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
  }, [rawResults, sort]);

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

  const hasQuery = query.length >= 2;

  const franchiseSuggestions = franchises.length > 0 && (
    <div className="mt-6">
      <p className="text-base text-[var(--color-text-muted)]">Prueba con una franquicia:</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {franchises.slice(0, 10).map((franchise) => (
          <li key={franchise.id}>
            <Link
              href={`/productos?franchise=${franchise.slug}`}
              className="inline-flex items-center min-h-11 px-4 text-sm font-medium bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-full hover:bg-[var(--color-border)] transition-colors"
            >
              {franchise.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          Buscar
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-12">
        <h1 className="type-page text-[var(--color-text)]">Buscar</h1>

        <form onSubmit={handleSearch} role="search" className="mt-6 max-w-2xl">
          <div className="relative">
            <Search
              strokeWidth={1.75}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Personaje, franquicia o número de figura"
              aria-label="Buscar productos"
              className="w-full min-h-14 pl-12 pr-28 text-base border border-[var(--color-border)] rounded-full bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-11 px-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>

        {hasQuery && !isLoading && !isError && (
          <p className="mt-4 text-base text-[var(--color-text-muted)] tabular-nums" aria-live="polite">
            {totalCount === 1 ? '1 resultado' : `${totalCount} resultados`} para &ldquo;{query}
            &rdquo;
          </p>
        )}
      </header>

      {!hasQuery ? (
        <div className="max-w-[60ch]">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Escribe al menos 2 letras para buscar
          </h2>
          {franchiseSuggestions}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start py-12 max-w-[52ch]">
          <PackageSearch strokeWidth={1.75} className="w-8 h-8 text-[var(--color-error)] mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
            No pudimos completar la búsqueda
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            Revisa tu conexión y vuelve a intentarlo.
          </p>
        </div>
      ) : sortedResults.length === 0 ? (
        <div className="max-w-[60ch]">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Sin resultados para &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-text-muted)]">
            Revisa la ortografía o usa un término más general, como el nombre de la saga.
          </p>
          {franchiseSuggestions}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end mb-6">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span className="hidden sm:inline">Ordenar por</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar resultados"
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
            {sortedResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Paginación">
              <button
                type="button"
                disabled={pageParam <= 1}
                onClick={() => goToPage(pageParam - 1)}
                className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    onClick={() => goToPage(p)}
                    aria-current={p === pageParam ? 'page' : undefined}
                    className={`min-w-11 h-11 rounded-full text-sm font-semibold tabular-nums transition-colors ${
                      p === pageParam
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
                disabled={pageParam >= totalPages}
                onClick={() => goToPage(pageParam + 1)}
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
  );
}
