import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CatalogContent } from './CatalogContent';
import { ProductCardSkeleton } from '@/components/product/ProductCard';

export const metadata: Metadata = {
  title: 'Todos los Productos — Juguetes para Frikis',
  description:
    'Explora nuestro catálogo completo de Funko Pop! originales. Filtra por franquicia, marca y precio.',
};

function CatalogFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-[var(--color-bg-alt)] rounded animate-pulse mb-6" />

      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-[260px] shrink-0">
          <div className="bg-[var(--color-bg-card)] rounded-lg p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--color-bg-alt)] rounded animate-pulse" />
                <div className="h-3 w-full bg-[var(--color-bg-alt)] rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-[var(--color-bg-alt)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="flex-1">
          <div className="h-10 w-full bg-[var(--color-bg-alt)] rounded animate-pulse mb-4" />
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

export default function ProductosPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}
