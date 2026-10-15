'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  variant: 'compact' | 'full';
}

export function CartItem({ item, variant }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();

  const handleRemove = () => {
    removeItem(item.productId, item.variantId);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1, item.variantId);
    } else {
      removeItem(item.productId, item.variantId);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < item.maxStock) {
      updateQuantity(item.productId, item.quantity + 1, item.variantId);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="py-3 px-2.5 border-b border-[var(--color-border)]">
        {/* Product name - bold */}
        <Link href={`/productos/${item.slug}`}>
          <h4 className="text-[11px] font-bold text-[var(--color-text)] line-clamp-2 leading-tight hover:text-[var(--color-primary)] transition-colors mb-2">
            {item.name}
          </h4>
        </Link>

        {/* Image centered */}
        <Link href={`/productos/${item.slug}`} className="block mx-auto w-fit mb-2">
          <div className="relative w-[90px] h-[90px] rounded overflow-hidden bg-[var(--color-bg-alt)] mx-auto">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="90px"
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-xs">
                [Img]
              </div>
            )}
          </div>
        </Link>

        {/* Price below image */}
        <p className="text-xs font-bold text-[var(--color-primary)] text-center mb-2">
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls: - quantity + */}
        <div className="flex items-center justify-center">
          <div className="flex items-center border border-[var(--color-primary)] rounded overflow-hidden">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 flex items-center justify-center text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              -
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold border-x border-[var(--color-primary)]">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= item.maxStock}
              className="w-8 h-8 flex items-center justify-center text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant (for cart page)
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-border)]">
      <Link href={`/productos/${item.slug}`} className="flex-shrink-0">
        <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden bg-[var(--color-bg-alt)]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
              [Imagen]
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/productos/${item.slug}`}>
          <h3 className="text-base font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
            {item.name}
          </h3>
        </Link>
        {item.variantName && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Variante: {item.variantName}</p>
        )}

        <p className="text-lg font-bold text-[var(--color-primary)] mt-2">
          {formatPrice(item.price)}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-base font-bold hover:bg-[var(--color-bg-alt)] disabled:opacity-30 transition-colors"
            >
              -
            </button>
            <span className="w-10 h-9 flex items-center justify-center text-sm font-medium border-x border-[var(--color-border)]">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= item.maxStock}
              className="w-9 h-9 flex items-center justify-center text-base font-bold hover:bg-[var(--color-bg-alt)] disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            className={cn(
              'text-sm text-[var(--color-text-muted)] hover:text-red-500 transition-colors'
            )}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-sm text-[var(--color-text-muted)]">Subtotal</p>
        <p className="text-base font-bold text-[var(--color-text)]">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
