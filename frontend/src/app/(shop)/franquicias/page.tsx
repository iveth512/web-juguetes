'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { useFranchises } from '@/hooks/useProducts';
import type { ProductListItem } from '@/types/product';

const FRAME_INKS = ['var(--color-primary)', 'var(--color-accent)'];

const PAGE_SIZE = 48;

async function getAllProducts(): Promise<ProductListItem[]> {
  const first = await getProducts({ page_size: String(PAGE_SIZE), ordering: '-is_featured' });
  const pages = Math.ceil(first.count / PAGE_SIZE);
  if (pages <= 1) return first.results;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      getProducts({
        page_size: String(PAGE_SIZE),
        ordering: '-is_featured',
        page: String(i + 2),
      })
    )
  );
  return [...first.results, ...rest.flatMap((r) => r.results)];
}

interface FranchiseSummary {
  count: number;
  image: string | null;
}

export default function FranquiciasPage() {
  const { data: franchises, isLoading: franchisesLoading } = useFranchises();
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'all-for-franchises'],
    queryFn: getAllProducts,
    staleTime: 5 * 60 * 1000,
  });

  // The franchise endpoint has no counts or images, so both are derived from the catalog.
  const summaries = useMemo(() => {
    const map = new Map<string, FranchiseSummary>();
    products?.forEach((p) => {
      const current = map.get(p.franchise) ?? { count: 0, image: null };
      current.count += 1;
      if (!current.image && p.primary_image_url) current.image = p.primary_image_url;
      map.set(p.franchise, current);
    });
    return map;
  }, [products]);

  const visible = useMemo(() => {
    if (!franchises) return [];
    // Without catalog data, list every franchise rather than hide them all.
    if (!products) return franchises;
    return franchises.filter((f) => (summaries.get(f.name)?.count ?? 0) > 0);
  }, [franchises, products, summaries]);

  const isLoading = franchisesLoading || productsLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
          Inicio
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          Franquicias
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-14">
        <h1 className="type-page text-[var(--color-text)]">Franquicias</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text)]">
          Del anime a los superhéroes y la música: elige tu universo y mira todas sus figuras
          disponibles.
          {!isLoading && visible.length > 0 && (
            <span className="text-[var(--color-text-muted)]">
              {' '}
              {visible.length} franquicias en el catálogo.
            </span>
          )}
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <div className="aspect-[4/5] rounded-xl bg-[var(--color-bg-alt)] animate-pulse" />
                <div className="mt-3 h-5 w-2/3 rounded bg-[var(--color-bg-alt)] animate-pulse" />
              </li>
            ))
          : visible.map((franchise, index) => {
              const summary = summaries.get(franchise.name);
              return (
                <li key={franchise.id}>
                  <Link href={`/productos?franchise=${franchise.slug}`} className="group block">
                    <div
                      className="photo-frame mr-1.5"
                      style={{ '--frame-ink': FRAME_INKS[index % FRAME_INKS.length] } as React.CSSProperties}
                    >
                    <div className="grain riso-photo aspect-[4/5] overflow-hidden rounded-md bg-[var(--color-stage)]">
                      {summary?.image ? (
                        <Image
                          src={summary.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          unoptimized
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 flex items-center justify-center type-hero text-[var(--color-stage-text)]"
                        >
                          {franchise.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold leading-snug text-[var(--color-text)] group-hover:text-[var(--color-primary-text)] transition-colors">
                      {franchise.name}
                    </h2>
                    {summary && (
                      <p className="text-sm text-[var(--color-text-muted)] tabular-nums">
                        {summary.count === 1 ? '1 figura' : `${summary.count} figuras`}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
      </ul>
    </div>
  );
}
