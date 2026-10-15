'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Sticker } from '@/components/ui/Sticker';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

function FavoritosContent() {
  const { wishlist, isLoading, count } = useWishlist();

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
          Favoritos
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-14">
        <h1 className="type-page text-[var(--color-text)]">Favoritos</h1>
        {!isLoading && count > 0 && (
          <p className="mt-3 text-base text-[var(--color-text-muted)] tabular-nums">
            {count === 1 ? '1 figura guardada' : `${count} figuras guardadas`}
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="grain relative mt-4 flex max-w-2xl flex-col items-start rounded-2xl bg-[var(--color-showcase)] px-6 pb-8 pt-12 text-[var(--color-showcase-text)] md:px-10">
          <Sticker tone="orange" tilt={-6} className="absolute -top-4 -left-2 z-10 text-xl md:text-2xl">
            Corazón libre
          </Sticker>
          <h2 className="text-2xl font-semibold mb-2">
            Aún no tienes favoritos
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-showcase-muted)] mb-6">
            Toca el corazón de cualquier figura para guardarla aquí y encontrarla después.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritosPage() {
  return (
    <ProtectedRoute>
      <FavoritosContent />
    </ProtectedRoute>
  );
}
