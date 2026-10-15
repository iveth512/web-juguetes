/*
 * Single source of chart styling. Colors were checked with the dataviz palette
 * validator on the light (#FFFFFF) and dark (#1E1E32) card surfaces.
 */
export const chartTokens = {
  /** Tailwind arbitrary properties that define the chart color variables (light + .dark). */
  varsClass:
    '[--ins-hi:var(--color-primary-hover)] [--ins-2:#6A55B8] dark:[--ins-2:#8070CC] [--ins-ctx:#CDD0D8] dark:[--ins-ctx:#44475E] [--ins-grid:#E5E7EB] dark:[--ins-grid:#2D2D44]',
  color: {
    hi: 'var(--ins-hi)',
    second: 'var(--ins-2)',
    ctx: 'var(--ins-ctx)',
    grid: 'var(--ins-grid)',
    axis: 'var(--color-text-muted)',
    surface: 'var(--color-bg-card)',
  },
  bar: {
    thickness: '0.875rem',
    maxColumnWidth: '1.5rem',
    gap: '2px',
    radiusEnd: '0 4px 4px 0',
    radiusTop: '4px 4px 0 0',
    dimmedOpacity: 0.5,
  },
  label: {
    category: 'truncate text-sm text-[var(--color-text)]',
    value: 'text-xs tabular-nums text-[var(--color-text-muted)]',
    valueStrong: 'text-xs font-semibold tabular-nums text-[var(--color-text)]',
    axis: 'text-[11px] leading-tight tabular-nums text-[var(--color-text-muted)]',
    legend: 'text-xs text-[var(--color-text-muted)]',
    chartTitle: 'text-sm font-semibold text-[var(--color-text)]',
  },
  /** Label column + plot column used by every horizontal chart so rows align. */
  rowGrid: 'grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]',
  valueColumn: 'w-[5.5rem]',
  focusRing: 'rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
  transition: 'transition-opacity duration-150',
} as const;

export type Tone = 'hi' | 'second' | 'ctx';
export const toneColor: Record<Tone, string> = {
  hi: chartTokens.color.hi,
  second: chartTokens.color.second,
  ctx: chartTokens.color.ctx,
};
