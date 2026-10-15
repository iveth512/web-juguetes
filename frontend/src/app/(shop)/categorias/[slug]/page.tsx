import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/api';
import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { CategoryContent } from './CategoryContent';

type Props = {
  params: Promise<{ slug: string }>;
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'figuras-de-accion': '🦸',
  'funko-pop': '🎭',
  'lego': '🧱',
  'peluches': '🧸',
  'juegos-de-mesa': '🎲',
  'coleccionables': '⭐',
  'manga-comics': '📚',
  'tecnologia-gamer': '🎮',
  'ropa-accesorios': '👕',
  'decoracion': '🖼️',
  'miniaturas': '🎨',
  'cartas': '🃏',
};

async function fetchCategoryBySlug(slug: string) {
  try {
    const categories = await getCategories();
    return categories.find((c) => c.slug === slug) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return { title: 'Categoria no encontrada' };
  }

  return {
    title: `${category.name} — Juguetes para Frikis`,
    description:
      category.description ||
      `Explora nuestra coleccion de ${category.name}. ${category.product_count} productos disponibles.`,
    openGraph: {
      title: `${category.name} — Juguetes para Frikis`,
      description:
        category.description ||
        `Explora nuestra coleccion de ${category.name}.`,
    },
    alternates: {
      canonical: `https://juguetesparafrikis.com/categorias/${category.slug}`,
    },
  };
}

function CategoryFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-40 bg-[var(--color-bg-alt)] rounded-xl animate-pulse mb-6" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-[260px] shrink-0">
          <div className="bg-[var(--color-bg-card)] rounded-lg p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--color-bg-alt)] rounded animate-pulse" />
                <div className="h-3 w-full bg-[var(--color-bg-alt)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const emoji = CATEGORY_EMOJIS[slug] || '🏷️';

  return (
    <>
      {/* Category hero */}
      <div className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-primary)] py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-5xl mb-3 block">{emoji}</span>
          <h1 className="font-heading font-extrabold text-[32px] text-white mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/80 text-sm max-w-lg mx-auto mb-3">
              {category.description}
            </p>
          )}
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {category.product_count} productos
          </span>
        </div>
      </div>

      <Suspense fallback={<CategoryFallback />}>
        <CategoryContent
          categorySlug={slug}
          categoryName={category.name}
        />
      </Suspense>
    </>
  );
}
