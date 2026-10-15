import { adminCardClass } from '@/components/admin/AdminShell';
import { chartTokens as t } from './tokens';

/** KPI tile: label, value (proportional figures) and an optional comparison line. */
export function StatTile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className={`${adminCardClass} p-4`}>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--color-text)] md:text-3xl">{value}</p>
      {children}
    </div>
  );
}

/** Signed change vs. a named period; the arrow carries direction, text stays in ink. */
export function Delta({ change, suffix }: { change: number; suffix: string }) {
  const up = change >= 0;
  return (
    <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
      <svg aria-hidden viewBox="0 0 12 12" className={`size-3 shrink-0 ${up ? '' : 'rotate-180'}`} style={{ color: up ? t.color.hi : t.color.second }}>
        <path d="M6 2 10 8H2z" fill="currentColor" />
      </svg>
      <span>
        <span className="font-semibold text-[var(--color-text)]">{up ? '+' : '−'}{Math.abs(Math.round(change)).toLocaleString('es-CO')} %</span> {suffix}
      </span>
    </p>
  );
}
