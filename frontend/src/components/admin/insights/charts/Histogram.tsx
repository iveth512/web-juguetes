'use client';

import { useState } from 'react';
import { chartTokens as t, toneColor, type Tone } from './tokens';

export interface ColumnDatum {
  key: string;
  label: string;
  value: number;
  tone: Tone;
  /** Shown on the cap; leave empty to keep labels selective. */
  capLabel?: string;
  title: string;
}

/** Vertical columns from one baseline (histograms, day/hour counts). `labelEvery` thins dense axes. */
export function Histogram({ data, height = 140, labelEvery = 1, divider, ariaLabel }: {
  data: ColumnDatum[];
  height?: number;
  labelEvery?: number;
  divider?: { beforeIndex: number; label: string };
  ariaLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="group" aria-label={ariaLabel}>
      <div className="relative flex items-end border-b" style={{ height: height + 20, gap: t.bar.gap, borderColor: t.color.grid }}>
        {data.map((d, i) => (
          <div
            key={d.key}
            tabIndex={0}
            aria-label={d.title}
            title={d.title}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-end ${t.focusRing}`}
          >
            {(d.capLabel || active === i) && <span className={`mb-1 whitespace-nowrap ${t.label.valueStrong}`}>{d.capLabel ?? d.value}</span>}
            <span
              className={`block w-full ${t.transition}`}
              style={{
                maxWidth: t.bar.maxColumnWidth,
                height: d.value > 0 ? Math.max((d.value / top) * height, 3) : 0,
                background: toneColor[d.tone],
                borderRadius: t.bar.radiusTop,
                opacity: active === null || active === i ? 1 : t.bar.dimmedOpacity,
              }}
            />
            {divider?.beforeIndex === i && <span aria-hidden className="absolute -left-px bottom-0 top-0 w-px" style={{ background: t.color.axis }} />}
          </div>
        ))}
        {divider && (
          <span aria-hidden className={`pointer-events-none absolute top-0 whitespace-nowrap pl-1.5 ${t.label.valueStrong}`} style={{ left: `${(divider.beforeIndex / data.length) * 100}%` }}>
            {divider.label}
          </span>
        )}
      </div>
      <div aria-hidden className="mt-1.5 flex" style={{ gap: t.bar.gap }}>
        {data.map((d, i) => (
          <span key={d.key} className={`min-w-0 flex-1 text-center ${t.label.axis}`}>{i % labelEvery === 0 ? d.label : ''}</span>
        ))}
      </div>
    </div>
  );
}
