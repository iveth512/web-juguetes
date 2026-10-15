'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';

function FavoritosContent() {
  const { wishlist, isLoading, count } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Mis Favoritos</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold text-[var(--color-text)] mb-8">
        Mis Favoritos ({count})
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-[var(--color-text-muted)] mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="font-heading text-xl font-semibold text-[var(--color-text)] mb-2">
            No tienes favoritos aun
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6 text-center max-w-md">
            Explora nuestro catalogo y agrega tus productos favoritos para encontrarlos facilmente.
          </p>
          <Link
            href="/productos"
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
