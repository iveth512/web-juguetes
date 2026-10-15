'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { StarRating } from './StarRating';
import type { ProductListItem } from '@/types/product';

interface ProductCardProps {
  product: ProductListItem;
}

// One badge per card, so a single signal reads at a glance.
function getBadge(product: ProductListItem) {
  if (product.stock === 0) {
    return { label: 'Agotado', className: 'bg-[var(--color-text)] text-[var(--color-bg)]' };
  }
  if (product.is_on_sale && product.sale_percentage) {
    return {
      label: `-${product.sale_percentage}%`,
      className: 'bg-[var(--color-primary)] text-[var(--color-on-primary)]',
    };
  }
  if (product.is_new) {
    return { label: 'Nuevo', className: 'bg-[var(--color-accent)] text-[var(--color-on-accent)]' };
  }
  return null;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isInWishlist } = useWishlist();
  const { add, remove } = useToggleWishlist();
  const inWishlist = isInWishlist(product.id);
  const badge = getBadge(product);
  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;
  const href = `/productos/${product.slug}`;

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (inWishlist) remove(product.id);
    else add(product.id);
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.base_price),
      image: product.primary_image_url || '',
      quantity: 1,
      maxStock: product.stock,
      slug: product.slug,
    });
  };

  return (
    <article className={cn('group relative', isOutOfStock && 'opacity-70')}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--color-bg-alt)]">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--color-text-muted)]">
            Sin foto todavía
          </div>
        )}

        {badge && (
          <span
            className={cn(
              'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none',
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}

        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] transition-[background-color,transform] hover:bg-[var(--color-primary-hover)] active:scale-95"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="pt-3">
        <p className="text-[13px] text-[var(--color-text-muted)]">{product.franchise}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--color-text)]">
          {/* Stretched link: the whole card is clickable while the buttons stay real siblings. */}
          <Link href={href} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-[var(--color-primary)]">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold tabular-nums text-[var(--color-text)]">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_price && (
            <span className="text-sm tabular-nums text-[var(--color-text-muted)] line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>

        {(isLowStock || product.review_count > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--color-text-muted)]">
            {product.review_count > 0 && (
              <span className="flex items-center gap-1">
                <StarRating rating={product.average_rating || 0} size="sm" />
                <span>({product.review_count})</span>
              </span>
            )}
            {isLowStock && (
              <span className="font-medium text-[var(--color-primary-text)]">
                {product.stock === 1 ? 'Queda 1' : `Quedan ${product.stock}`}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleWishlistToggle}
        className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg)]/85 text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
        aria-label={inWishlist ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
        aria-pressed={inWishlist}
      >
        <Heart
          className={cn('h-5 w-5', inWishlist && 'fill-[var(--color-primary)] text-[var(--color-primary)]')}
          strokeWidth={1.75}
        />
      </button>

    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-xl bg-[var(--color-bg-alt)]" />
      <div className="space-y-2 pt-3">
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-bg-alt)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg-alt)]" />
        <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-bg-alt)]" />
      </div>
    </div>
  );
}
