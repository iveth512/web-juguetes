'use client';

import Link from 'next/link';
import { useNewProducts } from '@/hooks/useProducts';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

export function NovedadesContent() {
  const { data, isLoading } = useNewProducts();
  const products = data?.results || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Novedades</span>
      </nav>

      <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-2">
        Novedades
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Los ultimos productos que llegaron a nuestra tienda.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">
          No hay novedades por ahora. Vuelve pronto.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
