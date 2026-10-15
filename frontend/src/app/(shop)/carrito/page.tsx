'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartRecommendations } from '@/components/cart/CartRecommendations';

export default function CarritoPage() {
  const { items, totalItems, hasHydrated, clearCart } = useCart();

  // Don't render cart content until hydrated to avoid mismatch
  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-[var(--color-bg-alt)] rounded" />
          <div className="h-48 bg-[var(--color-bg-alt)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Carrito</span>
      </nav>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-[var(--color-text-muted)] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-3">
            Tu carrito esta vacio
          </h1>
          <p className="text-[var(--color-text-muted)] mb-8 max-w-md">
            Parece que aun no has agregado productos. Explora nuestros Funko Pop! y encuentra tu próximo favorito.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/productos"
              className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Explorar productos
            </Link>
            <Link
              href="/ofertas"
              className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:border-[var(--color-primary)] transition-colors"
            >
              Ofertas de la semana
            </Link>
            <Link
              href="/franquicias"
              className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:border-[var(--color-primary)] transition-colors"
            >
              Franquicias
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl font-bold text-[var(--color-text)]">
              Carrito de Compra ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
            </h1>
            <button
              onClick={clearCart}
              className="text-sm text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            {/* Left: Cart items */}
            <div>
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  item={item}
                  variant="full"
                />
              ))}
            </div>

            {/* Right: Summary */}
            <div>
              <CartSummary />
            </div>
          </div>

          {/* Recommendations */}
          <CartRecommendations />
        </>
      )}
    </div>
  );
}
