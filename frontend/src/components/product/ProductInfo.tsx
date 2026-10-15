'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatPrice, getStockStatus } from '@/lib/utils';
import { getShippingZones } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { VariantSelector } from './VariantSelector';
import type { ProductDetail, ProductVariant, ShippingZone } from '@/types/product';

interface ProductInfoProps {
  product: ProductDetail;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={cn('w-4 h-4', filled ? 'text-[var(--color-primary)]' : 'text-gray-300')}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ShippingTable() {
  const { data: zones, isLoading } = useQuery<ShippingZone[]>({
    queryKey: ['shipping-zones'],
    queryFn: getShippingZones,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-[var(--color-bg-alt)] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left py-2 font-semibold">Zona</th>
            <th className="text-left py-2 font-semibold">Costo</th>
            <th className="text-left py-2 font-semibold">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {zones?.map((zone) => (
            <tr key={zone.id} className="border-b border-[var(--color-border)]/50">
              <td className="py-2">{zone.name}</td>
              <td className="py-2">{formatPrice(zone.price)}</td>
              <td className="py-2">
                {zone.min_days}-{zone.max_days} dias habiles
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-green-600 font-medium">
        Envio GRATIS en compras superiores a $250.000 COP
      </p>
    </div>
  );
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');

  // Determine current price/stock based on selected variant
  const currentPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const currentComparePrice = selectedVariant ? selectedVariant.compare_price : product.compare_price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const stockStatus = getStockStatus(currentStock, product.low_stock_threshold);

  const salePercentage = product.is_on_sale && product.sale_percentage ? product.sale_percentage : null;

  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant?.name,
      price: parseFloat(currentPrice),
      image: product.images?.[0]?.image || '',
      quantity,
      maxStock: currentStock,
      slug: product.slug,
    });
  };

  const handleAddToFavorites = () => {
    console.log('Add to favorites:', product.slug);
  };

  const tabs = [
    { key: 'description' as const, label: 'Descripcion' },
    { key: 'specs' as const, label: 'Especificaciones' },
    { key: 'shipping' as const, label: 'Envio' },
  ];

  const specsRows = [
    { label: 'Marca', value: product.brand.name },
    { label: 'Franquicia', value: product.franchise.name },
    { label: 'Tamano', value: product.dimensions || '-' },
    { label: 'Peso', value: product.weight_grams ? `${product.weight_grams}g` : '-' },
    { label: 'SKU', value: selectedVariant?.sku || product.sku },
  ];

  return (
    <div className="space-y-5">
      {/* Franchise */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
        {product.franchise.name}
      </p>

      {/* Title */}
      <h1 className="font-heading text-[26px] font-bold text-[var(--color-text)] leading-tight">
        {product.name}
      </h1>

      {/* Rating + SKU */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= 4} />
          ))}
          <span className="ml-1 text-[var(--color-text-muted)]">4.8 (24 reviews)</span>
        </div>
        <span className="text-[var(--color-text-muted)]">|</span>
        <span className="text-[var(--color-text-muted)]">
          SKU: {selectedVariant?.sku || product.sku}
        </span>
      </div>

      {/* Price block */}
      <div className="bg-[var(--color-bg-alt)] rounded-lg p-4">
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-[32px] font-extrabold text-[var(--color-primary)]">
            {formatPrice(currentPrice)}
          </span>
          {currentComparePrice && (
            <>
              <span className="text-lg text-[var(--color-text-muted)] line-through">
                {formatPrice(currentComparePrice)}
              </span>
              {salePercentage && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded">
                  -{salePercentage}%
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Precio incluye importacion. IVA incluido.
        </p>
      </div>

      {/* Variant selector */}
      {product.has_variants && product.variants.length > 0 && (
        <VariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariant?.id || null}
          onSelect={setSelectedVariant}
        />
      )}

      {/* Stock indicator */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            stockStatus.color === 'success' && 'bg-green-500',
            stockStatus.color === 'warning' && 'bg-orange-500',
            stockStatus.color === 'error' && 'bg-red-500'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium',
            stockStatus.color === 'success' && 'text-green-600',
            stockStatus.color === 'warning' && 'text-orange-500',
            stockStatus.color === 'error' && 'text-red-500'
          )}
        >
          {stockStatus.label}
        </span>
      </div>

      {/* Quantity selector */}
      {currentStock > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-[var(--color-text)]">Cantidad:</label>
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[var(--color-bg-alt)] transition-colors"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(val, currentStock)));
              }}
              className="w-14 h-10 text-center text-sm font-medium border-x border-[var(--color-border)] bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={1}
              max={currentStock}
            />
            <button
              onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[var(--color-bg-alt)] transition-colors"
              disabled={quantity >= currentStock}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={currentStock === 0}
          className={cn(
            'w-full py-3.5 rounded-lg text-base font-bold transition-colors',
            currentStock > 0
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {currentStock > 0 ? 'Agregar al Carrito' : 'Agotado'}
        </button>
        <button
          onClick={handleAddToFavorites}
          className="w-full py-3 rounded-lg text-base font-medium border-2 border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
        >
          Agregar a Favoritos
        </button>
      </div>

      {/* Trust row */}
      <div className="flex items-center justify-between gap-4 py-3">
        <TrustBadge icon="✓" text="100% Original" />
        <TrustBadge icon="📦" text="Envio seguro" />
        <TrustBadge icon="↩" text="30 dias devolucion" />
      </div>

      {/* Divider */}
      <hr className="border-[var(--color-border)]" />

      {/* Tabs */}
      <div>
        <div className="flex border-b border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-4">
          {activeTab === 'description' && (
            <div className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-line">
              {product.description || product.short_description || 'Sin descripcion disponible.'}
            </div>
          )}

          {activeTab === 'specs' && (
            <table className="w-full text-sm">
              <tbody>
                {specsRows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--color-border)]/50">
                    <td className="py-2 font-semibold text-[var(--color-text-muted)] w-1/3">
                      {row.label}
                    </td>
                    <td className="py-2 text-[var(--color-text)]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'shipping' && <ShippingTable />}
        </div>
      </div>
    </div>
  );
}
