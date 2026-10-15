import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { NovedadesContent } from './NovedadesContent';

export const metadata: Metadata = {
  title: 'Novedades — Juguetes para Frikis',
  description:
    'Descubre los últimos lanzamientos de Funko Pop! en Juguetes para Frikis: anime, Marvel, Star Wars y más.',
};

function NovedadesFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-8 w-48 bg-[var(--color-bg-alt)] rounded animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function NovedadesPage() {
  return (
    <Suspense fallback={<NovedadesFallback />}>
      <NovedadesContent />
    </Suspense>
  );
}
