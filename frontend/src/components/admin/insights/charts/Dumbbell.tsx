import { chartTokens as t } from './tokens';

export interface DumbbellRow { key: string; label: string; from: number; to: number; detail: string }

/** Two shares per row on one 0–max scale: hollow = baseline share, filled = actual share. */
export function Dumbbell({ rows, ariaLabel, formatTick }: { rows: DumbbellRow[]; ariaLabel: string; formatTick: (v: number) => string }) {
  const top = Math.max(...rows.flatMap((r) => [r.from, r.to]), 1) * 1.08;
  const x = (v: number) => `${(v / top) * 100}%`;
  return (
    <div>
      <ul role="group" aria-label={ariaLabel} className="space-y-1">
        {rows.map((r) => {
          const up = r.to >= r.from;
          return (
            <li key={r.key} tabIndex={0} aria-label={`${r.label}: ${r.detail}`} className={`${t.rowGrid} items-center py-1 ${t.focusRing}`}>
              <span className={t.label.category} title={r.label}>{r.label}</span>
              <span className="relative h-6 min-w-0" title={r.detail}>
                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px" style={{ background: t.color.grid }} />
                <span aria-hidden className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: x(Math.min(r.from, r.to)), width: `${(Math.abs(r.to - r.from) / top) * 100}%`, background: up ? t.color.hi : t.color.ctx }} />
                <span aria-hidden className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ left: x(r.from), borderColor: t.color.axis, background: t.color.surface }} />
                <span aria-hidden className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--color-bg-card)]" style={{ left: x(r.to), background: up ? t.color.hi : t.color.second }} />
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-hidden className={`mt-1 ${t.rowGrid} ${t.label.axis}`}>
        <span />
        <span className="flex justify-between"><span>{formatTick(0)}</span><span>{formatTick(top)}</span></span>
      </div>
    </div>
  );
}
