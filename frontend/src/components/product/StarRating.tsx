'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-6 w-6' };
const STARS = [1, 2, 3, 4, 5];

function StarGlyph({ filled, size }: { filled: boolean; size: keyof typeof sizes }) {
  return (
    <Star
      className={cn(
        sizes[size],
        filled
          ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
          : 'fill-transparent text-[var(--color-text-muted)]'
      )}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

export function StarRating({ rating, size = 'sm', interactive = false, onChange }: StarRatingProps) {
  const rounded = Math.round(rating);

  if (!interactive) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${rating.toLocaleString('es-CO', { maximumFractionDigits: 1 })} de 5 estrellas`}
      >
        {STARS.map((star) => (
          <StarGlyph key={star} filled={star <= rounded} size={size} />
        ))}
      </span>
    );
  }

  return (
    <div className="-ml-2.5 flex items-center" role="radiogroup" aria-label="Calificación">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rounded === star}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange?.(star)}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-alt)]"
        >
          <StarGlyph filled={star <= rounded} size={size} />
        </button>
      ))}
    </div>
  );
}
