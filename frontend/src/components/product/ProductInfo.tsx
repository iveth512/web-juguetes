'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Heart, Minus, Plus, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { cn, formatPrice, getStockStatus } from '@/lib/utils';
import { getShippingZones } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import { FREE_SHIPPING_THRESHOLD } from '@/components/cart/CartSummary';
import { VariantSelector } from './VariantSelector';
import { StarRating } from './StarRating';
import type { ProductDetail, ProductVariant, ShippingZone } from '@/types/product';

interface ProductInfoProps {
  product: ProductDetail;
}

type TabKey = 'description' | 'specs' | 'shipping';

const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Producto 100% original' },
  { icon: Truck, text: 'Envío a toda Colombia' },
  { icon: RotateCcw, text: 'Devoluciones dentro de 30 días', href: '/devoluciones' },
];

function ShippingTable() {
  const { data: zones, isLoading, isError } = useQuery<ShippingZone[]>({
    queryKey: ['shipping-zones'],
    queryFn: getShippingZones,
  });

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-[var(--color-bg-alt)]" />
        ))}
      </div>
    );
  }

  if (isError || !zones?.length) {
    return (
      <p className="text-base text-[var(--color-text-muted)]">
        No pudimos cargar las tarifas de envío. Las verás al ingresar tu ciudad en el checkout.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
            <th scope="col" className="py-2 pr-3 font-medium">Destino</th>
            <th scope="col" className="py-2 pr-3 font-medium">Costo</th>
            <th scope="col" className="py-2 font-medium">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.id} className="border-b border-[var(--color-border)]">
              <td className="py-2 pr-3">{zone.name}</td>
              <td className="py-2 pr-3 tabular-nums">{formatPrice(zone.price)}</td>
              <td className="py-2">
                {zone.min_days}–{zone.max_days} días hábiles
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-base font-medium text-[var(--color-text)]">
        Envío gratis en compras desde {formatPrice(FREE_SHIPPING_THRESHOLD)}.
      </p>
    </div>
  );
}

export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const currentPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const currentComparePrice = selectedVariant ? selectedVariant.compare_price : product.compare_price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const stockStatus = getStockStatus(currentStock, product.low_stock_threshold);
  const hasDiscount =
    currentComparePrice !== null && parseFloat(currentComparePrice) > parseFloat(currentPrice);
  const salePercentage = hasDiscount && product.is_on_sale ? product.sale_percentage : null;
  const needsVariant = product.has_variants && product.variants.some((v) => v.is_active) && !selectedVariant;
  const canBuy = currentStock > 0;
  const safeQuantity = Math.min(quantity, Math.max(1, currentStock));

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isInWishlist } = useWishlist();
  const { add, remove, isPending: wishlistPending } = useToggleWishlist();
  const inWishlist = isInWishlist(product.id);

  // The mobile bar appears once the main buy buttons scroll out of view and
  // hides over the footer so it never covers the site's last links.
  useEffect(() => {
    const actions = actionsRef.current;
    const footer = document.querySelector('footer');
    if (!actions || typeof IntersectionObserver === 'undefined') return;
    let actionsVisible = true;
    let footerVisible = false;
    const update = () => setShowStickyBar(!actionsVisible && !footerVisible);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === actions) actionsVisible = entry.isIntersecting;
        else footerVisible = entry.isIntersecting;
      }
      update();
    });
    observer.observe(actions);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    if (needsVariant) {
      document.getElementById('variant-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant?.name,
      price: parseFloat(currentPrice),
      image: product.images?.[0]?.image || '',
      quantity: safeQuantity,
      maxStock: currentStock,
      slug: product.slug,
    });
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/productos/${product.slug}`)}`);
      return;
    }
    if (inWishlist) remove(product.id);
    else add(product.id);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Descripción' },
    { key: 'specs', label: 'Especificaciones' },
    { key: 'shipping', label: 'Envío' },
  ];

  const specsRows = [
    { label: 'Marca', value: product.brand.name },
    { label: 'Franquicia', value: product.franchise.name },
    { label: 'Tamaño', value: product.dimensions || '—' },
    { label: 'Peso', value: product.weight_grams ? `${product.weight_grams} g` : '—' },
    { label: 'SKU', value: selectedVariant?.sku || product.sku },
  ];

  const addLabel = !canBuy ? 'Agotado' : needsVariant ? 'Elige un tamaño' : 'Agregar al carrito';

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-3">
        <h1 className="text-[clamp(1.75rem,2.6vw,2.25rem)] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-text)] [overflow-wrap:anywhere] [text-wrap:balance]">
          {product.name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
          {product.review_count > 0 && product.average_rating !== null && (
            <a href="#resenas" className="flex items-center gap-2 hover:text-[var(--color-text)]">
              <StarRating rating={product.average_rating} size="sm" />
              <span>
                {product.average_rating.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
                ({product.review_count} {product.review_count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </a>
          )}
          <Link
            href={`/productos?franchise=${product.franchise.slug}`}
            className="font-medium text-[var(--color-primary-text)] hover:underline"
          >
            Más de {product.franchise.name}
          </Link>
          <span>SKU {selectedVariant?.sku || product.sku}</span>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[2rem] font-bold leading-none tabular-nums text-[var(--color-text)]">
            {formatPrice(currentPrice)}
          </span>
          {hasDiscount && currentComparePrice && (
            <span className="text-lg tabular-nums text-[var(--color-text-muted)] line-through">
              <span className="sr-only">Antes </span>
              {formatPrice(currentComparePrice)}
            </span>
          )}
          {salePercentage ? (
            <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-sm font-semibold text-[var(--color-on-accent)]">
              −{salePercentage}%
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">IVA e importación incluidos.</p>
      </div>

      {product.has_variants && product.variants.length > 0 && (
        <div id="variant-selector">
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariant?.id || null}
            onSelect={(variant) => {
              setSelectedVariant(variant);
              setQuantity(1);
            }}
          />
        </div>
      )}

      <p className="flex items-center gap-2 text-base font-medium text-[var(--color-text)]">
        <span
          aria-hidden="true"
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            stockStatus.color === 'success' && 'bg-[var(--color-accent)]',
            stockStatus.color === 'warning' && 'bg-[var(--color-primary)]',
            stockStatus.color === 'error' && 'bg-[var(--color-error)]'
          )}
        />
        <span className={cn(stockStatus.color === 'error' && 'text-[var(--color-error)]')}>
          {stockStatus.label}
        </span>
      </p>

      <div ref={actionsRef} className="space-y-3">
        {canBuy && (
          <div className="flex items-center gap-3">
            <label htmlFor="product-quantity" className="text-base font-medium text-[var(--color-text)]">
              Cantidad
            </label>
            <div className="flex items-center overflow-hidden rounded-full border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeQuantity <= 1}
                aria-label="Quitar una unidad"
              >
                <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
              <input
                id="product-quantity"
                type="number"
                inputMode="numeric"
                value={safeQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setQuantity(Math.max(1, Math.min(val, currentStock)));
                }}
                className="h-11 w-12 bg-transparent text-center text-base font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={1}
                max={currentStock}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safeQuantity >= currentStock}
                aria-label="Agregar una unidad"
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canBuy}
            className="min-h-12 flex-1 rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-alt)] disabled:text-[var(--color-text-muted)]"
          >
            {addLabel}
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={wishlistPending}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            title={inWishlist ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            className="flex min-h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-alt)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-60"
          >
            <Heart
              className={cn('h-5 w-5', inWishlist && 'fill-[var(--color-primary)] text-[var(--color-primary)]')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <ul className="grid gap-2 text-sm text-[var(--color-text)] sm:grid-cols-3 sm:gap-4 md:grid-cols-1 md:gap-2 xl:grid-cols-3 xl:gap-4">
        {TRUST_POINTS.map(({ icon: Icon, text, href }) => (
          <li key={text} className="flex items-center gap-2">
            <Icon className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden="true" />
            {href ? (
              <Link href={href} className="hover:underline">
                {text}
              </Link>
            ) : (
              <span>{text}</span>
            )}
          </li>
        ))}
      </ul>

      <div>
        <div role="tablist" aria-label="Información del producto" className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'min-h-11 rounded-full px-3 text-base font-medium transition-colors xl:px-4',
                activeTab === tab.key
                  ? 'bg-[var(--color-bg-alt)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="py-5">
          {activeTab === 'description' && (
            <div className="max-w-[65ch] whitespace-pre-line text-base leading-relaxed text-[var(--color-text)]">
              {product.description || product.short_description || 'Este producto aún no tiene descripción.'}
            </div>
          )}

          {activeTab === 'specs' && (
            <table className="w-full text-base">
              <tbody>
                {specsRows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--color-border)]">
                    <th scope="row" className="w-1/3 py-2 pr-3 text-left font-medium text-[var(--color-text-muted)]">
                      {row.label}
                    </th>
                    <td className="py-2 text-[var(--color-text)] [overflow-wrap:anywhere]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'shipping' && <ShippingTable />}
        </div>
      </div>

      {canBuy && (
        <div
          inert={!showStickyBar}
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 md:hidden',
            showStickyBar ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--color-text-muted)]">{product.name}</p>
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{formatPrice(currentPrice)}</p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="min-h-12 shrink-0 rounded-full bg-[var(--color-primary)] px-5 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {needsVariant ? 'Elige un tamaño' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
