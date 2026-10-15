'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { CartItem } from './CartItem';

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, totalItems, subtotal, isFreeShipping, hasHydrated } = useCart();

  const displayItems = hasHydrated ? items : [];
  const displayTotal = hasHydrated ? totalItems : 0;
  const displaySubtotal = hasHydrated ? subtotal : 0;
  const displayFreeShipping = hasHydrated ? isFreeShipping : false;

  // Auto-close when cart becomes empty
  useEffect(() => {
    if (hasHydrated && totalItems === 0 && isDrawerOpen) {
      closeDrawer();
    }
  }, [totalItems, hasHydrated, isDrawerOpen, closeDrawer]);

  const pathname = usePathname();
  // On checkout it would also cover the order summary and the pay button.
  const isOnCartPage = pathname === '/carrito' || pathname === '/checkout';

  // Show panel whenever there are items and not on cart/checkout pages
  const isVisible = displayTotal > 0 && !isOnCartPage;

  return (
    <div
      className={cn(
        'hidden lg:flex fixed top-0 right-0 bottom-0 z-[70] w-[180px]',
        'bg-[var(--color-bg)] shadow-2xl border-l border-[var(--color-border)]',
        'lg:flex-col',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Top: Subtotal + CTA */}
      <div className="px-2.5 pt-3 pb-2 border-b border-[var(--color-border)]">
        <div className="text-center mb-1.5">
          <p className="text-[10px] text-[var(--color-text-muted)]">Subtotal</p>
          <p className="font-heading text-sm font-extrabold text-[var(--color-text)]">
            {formatPrice(displaySubtotal)}
          </p>
        </div>

        {displayFreeShipping && (
          <p className="text-[10px] text-green-600 font-semibold text-center mb-1.5">
            Envio gratis!
          </p>
        )}

        {displayTotal > 0 && !displayFreeShipping && (
          <p className="text-[9px] text-[var(--color-text-muted)] text-center mb-1.5">
            Envio calculado al finalizar
          </p>
        )}

        <Link
          href="/carrito"
          className="block w-full py-1.5 rounded border border-[var(--color-border)] text-center text-[11px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
        >
          Ir al carrito
        </Link>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayItems.map((item) => (
          <CartItem
            key={`${item.productId}-${item.variantId || 'default'}`}
            item={item}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
