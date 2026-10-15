'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

function getBadge(product: ProductListItem) {
  if (product.stock === 0) {
    return { label: 'Agotado', className: 'bg-gray-500 text-white' };
  }
  if (product.stock > 0 && product.stock <= product.low_stock_threshold) {
    return {
      label: `Ultimas ${product.stock}`,
      className: 'bg-[var(--color-primary)] text-white animate-pulse',
    };
  }
  if (product.is_on_sale && product.sale_percentage) {
    return {
      label: `-${product.sale_percentage}%`,
      className: 'bg-[var(--color-accent)] text-white',
    };
  }
  if (product.is_new) {
    return {
      label: 'NUEVO',
      className: 'bg-[var(--color-accent)] text-white',
    };
  }
  if (product.is_featured) {
    return {
      label: 'TOP VENTAS',
      className: 'bg-[var(--color-primary)] text-white',
    };
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (inWishlist) {
      remove(product.id);
    } else {
      add(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <Link
      href={`/productos/${product.slug}`}
      className={cn(
        'group block rounded-lg border border-[var(--color-border)]',
        'bg-[var(--color-bg-card)] transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        isOutOfStock && 'opacity-70'
      )}
    >
      {/* Image area */}
      <div className="relative h-[200px] bg-[var(--color-bg-alt)] rounded-t-lg overflow-hidden">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
            [Imagen]
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span
            className={cn(
              'absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold',
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist heart (top-right) */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
          aria-label={inWishlist ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill={inWishlist ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: inWishlist ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Add to cart icon (mobile — bottom-right) */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="sm:hidden absolute bottom-2 right-2 p-1.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors z-10 shadow-lg"
            aria-label="Agregar al carrito"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white text-[9px] font-bold leading-none shadow-sm">+</span>
          </button>
        )}

        {/* Add to cart overlay (desktop only) */}
        {!isOutOfStock && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'hidden sm:block',
              'sm:translate-y-full sm:group-hover:translate-y-0',
              'transition-transform duration-300'
            )}
          >
            <button
              onClick={handleAddToCart}
              className="block w-full bg-[var(--color-primary)] text-white text-center text-sm font-semibold py-2 hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              Agregar al carrito
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Franchise */}
        <p className="text-[11px] text-[var(--color-text-muted)] mb-0.5">
          {product.franchise}
        </p>

        {/* Product name */}
        <h3 className="text-[13px] font-semibold text-[var(--color-text)] leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[17px] font-bold text-[var(--color-primary)]">
            {formatPrice(product.base_price)}
          </span>
          {product.compare_price && (
            <span className="text-xs text-[var(--color-text-muted)] line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <StarRating rating={product.average_rating || 0} size="sm" />
          <span className="text-[11px] text-[var(--color-text-muted)]">
            ({product.review_count || 0})
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
      <div className="h-[200px] bg-[var(--color-bg-alt)] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-[var(--color-bg-alt)] rounded animate-pulse" />
        <div className="h-4 w-full bg-[var(--color-bg-alt)] rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-[var(--color-bg-alt)] rounded animate-pulse" />
        <div className="h-5 w-24 bg-[var(--color-bg-alt)] rounded animate-pulse" />
      </div>
    </div>
  );
}
