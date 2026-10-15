'use client';

import { useState } from 'react';
import { chartTokens as t, toneColor, type Tone } from './tokens';

export interface BarRow {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  tone: Tone;
  detail?: string;
}

/** Horizontal ranked bars, value at the tip. Optional reference line at `marker`. */
export function BarChart({ rows, max, marker, ariaLabel }: {
  rows: BarRow[];
  max?: number;
  marker?: { value: number; label: string };
  ariaLabel: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const top = Math.max(max ?? 0, ...rows.map((r) => r.value), marker?.value ?? 0, 1);
  return (
    <div role="group" aria-label={ariaLabel}>
      <ul className="space-y-2.5">
        {rows.map((r, i) => (
          <li
            key={r.key}
            tabIndex={0}
            aria-label={`${r.label}: ${r.valueLabel}${r.detail ? `, ${r.detail}` : ''}`}
            onPointerEnter={() => setActive(r.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(r.key)}
            onBlur={() => setActive(null)}
            className={`${t.rowGrid} items-center ${t.focusRing}`}
          >
            <span className={t.label.category} title={r.label}>{r.label}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="relative min-w-0 flex-1" style={{ height: t.bar.thickness }}>
                <span
                  className={`ins-grow-x absolute inset-y-0 left-0 ${t.transition}`}
                  style={{
                    width: `${Math.max((r.value / top) * 100, r.value > 0 ? 1 : 0)}%`,
                    background: toneColor[r.tone],
                    borderRadius: t.bar.radiusEnd,
                    opacity: active === null || active === r.key ? 1 : t.bar.dimmedOpacity,
                    animationDelay: `${i * 45}ms`,
                  }}
                />
                {marker && (
                  <span aria-hidden className="absolute -inset-y-1.5 w-px" style={{ left: `${(marker.value / top) * 100}%`, background: t.color.axis }} />
                )}
              </span>
              <span className={`${t.valueColumn} shrink-0 text-right ${r.tone === 'hi' ? t.label.valueStrong : t.label.value}`}>{r.valueLabel}</span>
            </span>
            {active === r.key && r.detail && <span className={`col-span-2 -mt-1 ${t.label.value}`}>{r.detail}</span>}
          </li>
        ))}
      </ul>
      {marker && (
        <div aria-hidden className={`mt-2 ${t.rowGrid}`}>
          <span />
          <span className="flex gap-2">
            <span className="relative h-4 flex-1">
              <span className={`absolute -translate-x-1/2 whitespace-nowrap ${t.label.legend}`} style={{ left: `${(marker.value / top) * 100}%` }}>{marker.label}</span>
            </span>
            <span className={`${t.valueColumn} shrink-0`} />
          </span>
        </div>
      )}
    </div>
  );
}
