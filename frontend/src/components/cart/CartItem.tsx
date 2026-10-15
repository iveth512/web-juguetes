'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  /** Only the full row remains; kept so existing callers stay valid. */
  variant?: 'full';
}

const stepperButton =
  'flex h-11 w-11 items-center justify-center text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-40';

export function CartItem({ item }: CartItemProps) {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const atMax = item.quantity >= item.maxStock;

  return (
    <div className="flex items-start gap-4 py-4">
      <Link href={`/productos/${item.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-[var(--color-bg-alt)] sm:h-28 sm:w-28">
          {item.image && (
            <Image
              src={item.image}
              alt=""
              fill
              sizes="112px"
              className="object-contain"
              unoptimized
            />
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Link
              href={`/productos/${item.slug}`}
              className="text-base font-semibold leading-snug text-[var(--color-text)] transition-colors hover:text-[var(--color-primary-text)]"
            >
              {item.name}
            </Link>
            {item.variantName && (
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{item.variantName}</p>
            )}
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {formatPrice(item.price)} c/u
            </p>
          </div>
          <p className="text-base font-bold tabular-nums text-[var(--color-text)] sm:text-right">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center overflow-hidden rounded-full border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
              disabled={item.quantity <= 1}
              aria-label={`Quitar una unidad de ${item.name}`}
              className={stepperButton}
            >
              <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <span className="w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
              disabled={atMax}
              aria-label={`Agregar una unidad de ${item.name}`}
              className={stepperButton}
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Eliminar
          </button>

          {atMax && (
            <p className="w-full text-sm text-[var(--color-text-muted)]">
              Ya tienes todas las unidades disponibles ({item.maxStock}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
