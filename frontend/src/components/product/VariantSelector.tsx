'use client';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import type { ProductVariant } from '@/types/product';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const activeVariants = variants
    .filter((v) => v.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  if (activeVariants.length === 0) return null;

  return (
    <div>
      <label className="text-sm font-semibold text-[var(--color-text)] mb-2 block">
        Tamano:
      </label>
      <div className="flex flex-wrap gap-2">
        {activeVariants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelect(variant)}
            className={cn(
              'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors',
              selectedVariantId === variant.id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/50'
            )}
          >
            <span>{variant.name}</span>
            <span className="ml-2 text-xs opacity-75">{formatPrice(variant.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
