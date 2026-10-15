import { Swatch } from './Legend';
import { chartTokens as t } from './tokens';

/** One horizontal part-to-whole bar (2 segments) with direct labels below. */
export function SplitBar({ part, whole, partLabel, restLabel, ariaLabel }: {
  part: number; whole: number; partLabel: string; restLabel: string; ariaLabel: string;
}) {
  const share = whole > 0 ? (part / whole) * 100 : 0;
  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="flex" style={{ height: t.bar.thickness, gap: t.bar.gap }}>
        {share > 0 && <span className="h-full rounded-l" style={{ width: `${share}%`, background: t.color.hi }} />}
        {share < 100 && <span className="h-full flex-1 rounded-r" style={{ background: t.color.ctx }} />}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[var(--color-text)]"><Swatch tone="hi" />{partLabel}</span>
        <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]"><Swatch tone="ctx" />{restLabel}</span>
      </div>
    </div>
  );
}
