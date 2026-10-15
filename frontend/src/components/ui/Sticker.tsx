import { cn } from '@/lib/utils';

const TONES = {
  orange: { bg: 'var(--color-primary)', ink: 'var(--color-on-primary)' },
  green: { bg: 'var(--color-accent)', ink: 'var(--color-on-accent)' },
  purple: { bg: 'var(--color-secondary)', ink: '#FFFFFF' },
  ink: { bg: '#1A1A2E', ink: '#FFFFFF' },
  cream: { bg: '#FBF7EE', ink: '#1A1A2E' },
} as const;

export type StickerTone = keyof typeof TONES;

interface StickerProps {
  children: React.ReactNode;
  tone?: StickerTone;
  /** Degrees; small tilts read as hand-applied. */
  tilt?: number;
  round?: boolean;
  className?: string;
}

/** Die-cut vinyl sticker in the headline script; for short playful labels only. */
export function Sticker({ children, tone = 'orange', tilt = -7, round = false, className }: StickerProps) {
  const { bg, ink } = TONES[tone];
  return (
    <span
      className={cn('sticker', round && 'aspect-square !px-0 !py-0 leading-[0.95] whitespace-normal', className)}
      style={
        {
          '--sticker-bg': bg,
          '--sticker-ink': ink,
          '--sticker-tilt': `${tilt}deg`,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}
