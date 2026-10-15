import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

export const metadata: Metadata = {
  title: 'Buscar — Juguetes para Frikis',
  description:
    'Busca juguetes, figuras, coleccionables y mas en nuestro catalogo.',
};

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-8 w-64 bg-[var(--color-bg-alt)] rounded animate-pulse mb-4" />
          <div className="h-12 w-full max-w-xl bg-[var(--color-bg-alt)] rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[280px] bg-[var(--color-bg-alt)] rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
