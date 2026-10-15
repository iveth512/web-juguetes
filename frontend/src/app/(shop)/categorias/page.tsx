'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { useCategories } from '@/hooks/useProducts';
import type { Category } from '@/types/product';

const PREVIEW_COUNT = 4;

function CategoryBand({ category }: { category: Category }) {
  const { data } = useQuery({
    queryKey: ['products', 'category-preview', category.slug],
    queryFn: () =>
      getProducts({
        category: category.slug,
        ordering: '-is_featured',
        page_size: String(PREVIEW_COUNT),
      }),
    staleTime: 5 * 60 * 1000,
  });
  const previews = (data?.results ?? []).filter((p) => p.primary_image_url);

  return (
    <li className="grain grid gap-8 rounded-2xl bg-[var(--color-stage)] p-6 md:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12">
      <div>
        <h2 className="type-section text-[var(--color-stage-text)]">{category.name}</h2>
        <p className="mt-3 text-base text-[var(--color-stage-muted)] tabular-nums">
          {category.product_count === 1
            ? '1 producto'
            : `${category.product_count} productos`}
        </p>
        {category.description && (
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[var(--color-stage-text)]">
            {category.description}
          </p>
        )}
        <Link
          href={`/categorias/${category.slug}`}
          className="mt-8 inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ver {category.name}
        </Link>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {previews.map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--color-stage-raised)]"
            >
              <Image
                src={product.primary_image_url as string}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                unoptimized
              />
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

export default function CategoriasPage() {
  const { data: categories, isLoading } = useCategories();

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
          Categorías
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-14">
        <h1 className="type-page text-[var(--color-text)]">Categorías</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text)]">
          Todo el catálogo agrupado por tipo de coleccionable. Si buscas un personaje o una
          saga, explora también por{' '}
          <Link
            href="/franquicias"
            className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
          >
            franquicia
          </Link>
          .
        </p>
      </header>

      {isLoading ? (
        <div className="h-72 rounded-2xl bg-[var(--color-bg-alt)] animate-pulse" />
      ) : categories && categories.length > 0 ? (
        <ul className="flex flex-col gap-6 md:gap-8">
          {categories.map((cat) => (
            <CategoryBand key={cat.id} category={cat} />
          ))}
        </ul>
      ) : (
        <p className="text-base text-[var(--color-text-muted)]">
          Aún no hay categorías publicadas.{' '}
          <Link
            href="/productos"
            className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
          >
            Ver el catálogo completo
          </Link>
        </p>
      )}
    </div>
  );
}
