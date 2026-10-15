import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { OffersContent } from './OffersContent';

export const metadata: Metadata = {
  title: 'Ofertas de la semana — Juguetes para Frikis',
  description:
    'Funko Pop! originales con descuento esta semana. Ofertas por tiempo limitado en anime, Marvel, Star Wars y más.',
  openGraph: {
    title: 'Ofertas de la semana — Juguetes para Frikis',
    description: 'Funko Pop! originales con descuento esta semana. Ofertas por tiempo limitado.',
  },
  alternates: {
    canonical: 'https://juguetesparafrikis.com/ofertas',
  },
};

function OffersFallback() {
  return (
    <div>
      <div className="grain h-[280px] bg-[var(--color-stage)]" />
      <div className="max-w-7xl mx-auto px-4 pt-10 md:pt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OfertasPage() {
  return (
    <Suspense fallback={<OffersFallback />}>
      <OffersContent />
    </Suspense>
  );
}
