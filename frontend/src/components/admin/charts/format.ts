// Chart mark color: --color-primary-hover (#E06A10) passes the dataviz
// validator on both the light (#FFFFFF) and dark (#1E1E32) card surfaces;
// the lighter brand orange fails the dark-mode lightness band.
export const CHART_COLOR = 'var(--ins-hi, var(--color-primary-hover))';
// Context marks: the lilac-purple step, re-pointed per ground by the section that holds the chart.
export const CHART_CONTEXT = 'var(--ins-2, #6A55B8)';

const compact = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCompactCOP(value: number): string {
  return compact.format(value);
}

/** Round axis ticks to clean numbers: 0 / 50.000 / 100.000 ... */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const dayFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDayFormat = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "2026-10-14" -> "14 oct" (dates are calendar days, never shifted by time zone). */
export function formatDay(iso: string, long = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return (long ? longDayFormat : dayFormat).format(d);
}
