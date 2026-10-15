'use client';

import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useNewProducts } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

export function NovedadesContent() {
  const { data, isLoading } = useNewProducts();
  const products = data?.results || [];

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
          Novedades
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-14">
        <h1 className="type-page text-[var(--color-text)]">Novedades</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text)]">
          Las figuras que acaban de llegar a la tienda.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-start py-16 max-w-[52ch]">
          <Sparkles strokeWidth={1.75} className="w-8 h-8 text-[var(--color-text-muted)] mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
            No hay lanzamientos nuevos esta semana
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)] mb-6">
            Mientras llegan, explora el catálogo completo.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
