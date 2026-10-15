import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminProduct } from '@/types/admin';

// Local copies so the product screens don't depend on the admin chrome's exports.
export const pillClass =
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonClass = cn(
  pillClass,
  'bg-[var(--color-primary)] text-base text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]'
);

export const secondaryButtonClass = cn(
  pillClass,
  'border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'
);

export const textButtonClass =
  'inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

export const inputClass =
  'block w-full min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors hover:border-[color-mix(in_oklab,var(--color-text)_30%,var(--color-border))] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_35%,transparent)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-alt)] disabled:text-[var(--color-text-muted)]';

export const panelClass = 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClass: Record<Tone, { chip: string; dot: string }> = {
  success: {
    chip: 'bg-[color-mix(in_oklab,var(--color-accent)_24%,transparent)] text-[var(--color-text)]',
    dot: 'bg-[#4F7F16] dark:bg-[var(--color-accent)]',
  },
  warning: {
    chip: 'bg-[color-mix(in_oklab,#F5B820_28%,transparent)] text-[var(--color-text)]',
    dot: 'bg-[#B07A00] dark:bg-[#F5B820]',
  },
  danger: {
    chip: 'bg-[color-mix(in_oklab,var(--color-error)_16%,transparent)] text-[var(--color-text)]',
    dot: 'bg-[var(--color-error)]',
  },
  neutral: {
    chip: 'bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-border)]',
    dot: 'bg-[var(--color-text-muted)]',
  },
};

export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none', toneClass[tone].chip)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', toneClass[tone].dot)} aria-hidden />
      {children}
    </span>
  );
}

export function stockTone(p: Pick<AdminProduct, 'stock' | 'low_stock_threshold'>): { tone: Tone; label: string } {
  if (p.stock === 0) return { tone: 'danger', label: 'Agotado' };
  if (p.stock <= p.low_stock_threshold) return { tone: 'warning', label: 'Bajo' };
  return { tone: 'success', label: 'En stock' };
}

export function StockChip({ product }: { product: AdminProduct }) {
  const { tone, label } = stockTone(product);
  return <Chip tone={tone}>{label}</Chip>;
}

export function StatusChip({ active }: { active: boolean }) {
  return active ? <Chip tone="success">Activo</Chip> : <Chip tone="neutral">Inactivo</Chip>;
}

export function ProductThumb({ product, className }: { product: AdminProduct; className?: string }) {
  const image = product.images.find((i) => i.is_primary) ?? product.images[0];
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-bg-alt)]', className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.image} alt="" loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <ImageOff className="h-5 w-5 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden />
      )}
    </span>
  );
}
