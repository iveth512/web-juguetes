'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sticker } from '@/components/ui/Sticker';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartRecommendations } from '@/components/cart/CartRecommendations';
import { StaffNotice } from '@/components/auth/StaffNotice';
import { useIsStaff } from '@/hooks/useIsStaff';

function ClearCartControl({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-11 rounded-full px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]"
      >
        Vaciar carrito
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirmar vaciar el carrito">
      <span className="text-sm font-medium text-[var(--color-text)]">¿Vaciar el carrito?</span>
      <button
        type="button"
        onClick={onConfirm}
        autoFocus
        className="min-h-11 rounded-full bg-[var(--color-error)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Sí, vaciar
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="min-h-11 rounded-full px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
      >
        Cancelar
      </button>
    </div>
  );
}

export default function CarritoPage() {
  const { items, totalItems, hasHydrated, clearCart } = useCart();
  const isStaff = useIsStaff();

  if (isStaff) return <StaffNotice />;

  // Don't render cart content until hydrated to avoid mismatch
  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-64 rounded-lg bg-[var(--color-bg-alt)]" />
          <div className="h-48 rounded-2xl bg-[var(--color-bg-alt)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-primary-text)]">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text)]" aria-current="page">Carrito</span>
      </nav>

      {items.length === 0 ? (
        <div className="grain relative mx-auto my-10 flex max-w-3xl flex-col items-center rounded-2xl bg-[var(--color-showcase)] px-6 pb-12 pt-16 text-center text-[var(--color-showcase-text)] md:my-16 md:px-12">
          <Sticker tone="orange" tilt={-7} className="absolute -top-4 -left-2 z-10 text-xl md:text-2xl">
            Ni un Funko a la vista
          </Sticker>
          <h1 className="type-page mb-4">Tu carrito está vacío</h1>
          <p className="mb-8 max-w-md text-base text-[var(--color-showcase-muted)]">
            Aún no has agregado productos. Explora los Funko Pop! y encuentra tu próximo favorito.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/productos"
              className="flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Explorar productos
            </Link>
            <Link
              href="/ofertas"
              className="flex min-h-12 items-center rounded-full bg-[var(--color-showcase-raised)] px-6 text-base font-semibold text-[var(--color-showcase-text)] transition-opacity hover:opacity-85"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h1 className="type-page text-[var(--color-text)]">Tu carrito</h1>
              <p className="mt-2 text-base text-[var(--color-text-muted)]">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            <ClearCartControl onConfirm={clearCart} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
            <div className="-mt-4">
              {items.map((item) => (
                <CartItem key={`${item.productId}-${item.variantId || 'default'}`} item={item} />
              ))}
              <Link
                href="/productos"
                className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-[var(--color-primary-text)] hover:underline"
              >
                Seguir comprando
              </Link>
            </div>

            <div>
              <CartSummary />
            </div>
          </div>

          <CartRecommendations />
        </>
      )}
    </div>
  );
}
