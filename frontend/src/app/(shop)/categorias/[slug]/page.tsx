import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/api';
import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { CategoryContent } from './CategoryContent';

type Props = {
  params: Promise<{ slug: string }>;
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
    return { title: 'Categoría no encontrada' };
  }

  return {
    title: `${category.name} — Juguetes para Frikis`,
    description:
      category.description ||
      `Explora nuestra colección de ${category.name}. ${category.product_count} productos disponibles.`,
    openGraph: {
      title: `${category.name} — Juguetes para Frikis`,
      description:
        category.description ||
        `Explora nuestra colección de ${category.name}.`,
    },
    alternates: {
      canonical: `https://juguetesparafrikis.com/categorias/${category.slug}`,
    },
  };
}

function CategoryFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-4 w-48 bg-[var(--color-bg-alt)] rounded animate-pulse mb-6" />
      <div className="h-16 w-72 max-w-full bg-[var(--color-bg-alt)] rounded animate-pulse mb-10" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-[260px] shrink-0">
          <div className="space-y-6">
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

  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryContent
        categorySlug={slug}
        categoryName={category.name}
        categoryDescription={category.description}
      />
    </Suspense>
  );
}
