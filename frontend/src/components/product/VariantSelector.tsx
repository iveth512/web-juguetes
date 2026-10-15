'use client';

import { cn, formatPrice } from '@/lib/utils';
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
    <fieldset>
      <legend className="mb-2 text-base font-medium text-[var(--color-text)]">Tamaño</legend>
      <div className="flex flex-wrap gap-2">
        {activeVariants.map((variant) => {
          const selected = selectedVariantId === variant.id;
          const soldOut = variant.stock === 0;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant)}
              aria-pressed={selected}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-base font-medium transition-colors',
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg-alt)] text-[var(--color-text)]'
                  : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text-muted)]',
                soldOut && 'text-[var(--color-text-muted)] line-through'
              )}
            >
              <span>{variant.name}</span>
              <span className="text-sm text-[var(--color-text-muted)] tabular-nums">
                {soldOut ? 'Agotado' : formatPrice(variant.price)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
