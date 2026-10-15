'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useProducts';

const categoryIcons: Record<string, string> = {
  'funko-pop': '🎭',
  'figuras-de-accion': '🎲',
  peluches: '🧸',
  'tcg-cartas': '🃏',
  estatuas: '🏛️',
  accesorios: '🎒',
};

function getIcon(slug: string): string {
  return categoryIcons[slug] || '🎲';
}

export default function CategoriasPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Categorias</span>
      </nav>

      <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-8">
        Todas las Categorias
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-[var(--color-bg-alt)] animate-pulse"
              />
            ))
          : categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className={cn(
                  'flex flex-col items-center justify-center h-44 rounded-xl p-6',
                  'text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-xl'
                )}
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                }}
              >
                <span className="text-4xl mb-3">{getIcon(cat.slug)}</span>
                <h2 className="font-heading text-base font-bold text-center">{cat.name}</h2>
                <p className="text-sm text-white/70 mt-1">
                  {cat.product_count} productos
                </p>
              </Link>
            ))}
      </div>
    </div>
  );
}
