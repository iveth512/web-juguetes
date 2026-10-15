'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { Sticker } from '@/components/ui/Sticker';
import type { CartItem } from '@/types/cart';

const AUTO_DISMISS_MS = 4000;

interface AddedNotice {
  item: CartItem;
  addedQuantity: number;
  id: number;
}

function sameLine(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

/**
 * "Added to cart" confirmation. Kept under the CartDrawer name because the
 * root layout mounts it; it reacts to the same store signal (addItem opens
 * the drawer) but shows a small dismissible notice instead of a side rail.
 */
export function CartDrawer() {
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const [notice, setNotice] = useState<AddedNotice | null>(null);
  const [paused, setPaused] = useState(false);
  const pathname = usePathname();

  useEffect(
    () =>
      useCartStore.subscribe((state, prev) => {
        if (!state.isDrawerOpen || state.items === prev.items) return;
        for (const item of state.items) {
          const before = prev.items.find((p) => sameLine(p, item));
          const added = item.quantity - (before?.quantity ?? 0);
          if (added > 0) {
            setNotice({ item, addedQuantity: added, id: Date.now() });
            return;
          }
        }
      }),
    []
  );

  const dismiss = useCallback(() => {
    setNotice(null);
    setPaused(false);
    closeDrawer();
  }, [closeDrawer]);

  useEffect(() => {
    if (!notice || paused) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice, paused, dismiss]);

  useEffect(() => {
    if (!notice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notice, dismiss]);

  // The cart and checkout pages already show the cart contents.
  const onCartPage = pathname === '/carrito' || pathname === '/checkout';
  const visible = notice !== null && !onCartPage;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-auto md:top-[112px] lg:top-[160px] md:justify-end md:px-6"
    >
      {visible && (
        <div
          key={notice.id}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
          className="pointer-events-auto w-full max-w-[400px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
              <Check className="h-5 w-5 text-[var(--color-primary-text)]" strokeWidth={1.75} aria-hidden="true" />
              Agregado al carrito
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar aviso"
              className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="relative shrink-0">
            <Sticker tone="green" tilt={-10} className="absolute -top-2 -left-2 z-10 text-sm">
              ¡Tuyo!
            </Sticker>
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-[var(--color-bg-alt)]">
              {notice.item.image && (
                <Image
                  src={notice.item.image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-text)]">
                {notice.item.name}
              </p>
              {notice.item.variantName && (
                <p className="text-sm text-[var(--color-text-muted)]">{notice.item.variantName}</p>
              )}
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {notice.addedQuantity > 1 ? `${notice.addedQuantity} × ` : ''}
                <span className="font-semibold text-[var(--color-text)]">{formatPrice(notice.item.price)}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link
              href="/carrito"
              onClick={dismiss}
              className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Ver carrito
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 rounded-full px-4 text-base font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
