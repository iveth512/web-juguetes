'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import type { SalesDay } from '@/types/admin';
import { CHART_COLOR, formatCompactCOP, formatDay, niceTicks } from './format';

const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 64 };
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 4;

/** Column with a 4px rounded data-end and a square baseline. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function SalesByDayChart({ days }: { days: SalesDay[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = days.map((d) => Number(d.total));
  const ticks = niceTicks(Math.max(...values, 0));
  const yMax = ticks[ticks.length - 1] || 1;
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotW / Math.max(days.length, 1);
  const barW = Math.max(2, Math.min(MAX_BAR, slot - GAP));
  const y = (v: number) => MARGIN.top + plotH - (v / yMax) * plotH;

  // Label ~6 evenly spaced days so the axis never crowds.
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(plotW / 80))));
  const total = values.reduce((a, b) => a + b, 0);
  const activeDay = active !== null ? days[active] : null;

  return (
    <div ref={wrapRef} className="relative w-full" onPointerLeave={() => setActive(null)}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Ventas por dia: ${formatPrice(total)} en ${days.length} dias`}
        className="block"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-text-muted)">
              {formatCompactCOP(t)}
            </text>
          </g>
        ))}

        {days.map((d, i) => {
          const v = values[i];
          const x = MARGIN.left + i * slot + (slot - barW) / 2;
          const h = (v / yMax) * plotH;
          return (
            <g key={d.fecha}>
              {h > 0 && (
                <path
                  d={columnPath(x, y(v), barW, h)}
                  fill={CHART_COLOR}
                  opacity={active === null || active === i ? 1 : 0.45}
                />
              )}
              {/* Hit target: the whole column slot, bigger than the mark */}
              <rect
                x={MARGIN.left + i * slot}
                y={MARGIN.top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${formatDay(d.fecha, true)}: ${formatPrice(v)}, ${d.pedidos} pedidos`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:stroke-[var(--color-text-muted)]"
              />
              {((i % labelEvery === 0 && days.length - 1 - i >= labelEvery / 2) || i === days.length - 1) && (
                <text
                  // Edge labels anchor inward so they never clip at the SVG border.
                  x={i === days.length - 1 ? width - MARGIN.right : i === 0 ? MARGIN.left : MARGIN.left + i * slot + slot / 2}
                  y={HEIGHT - 8}
                  textAnchor={i === days.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                  fontSize={11}
                  fill="var(--color-text-muted)"
                >
                  {formatDay(d.fecha)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} stroke="var(--color-text-muted)" strokeWidth={1} />
      </svg>

      {activeDay && active !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(MARGIN.left + active * slot + slot / 2 - 80, 0), width - 160),
            top: Math.max(y(values[active]) - 72, 0),
            width: 160,
          }}
        >
          <p className="text-[var(--color-text-muted)]">{formatDay(activeDay.fecha, true)}</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="inline-block h-0.5 w-3 rounded" style={{ background: CHART_COLOR }} aria-hidden />
            <strong className="text-sm text-[var(--color-text)]">{formatPrice(values[active])}</strong>
          </p>
          <p className="text-[var(--color-text-muted)]">{activeDay.pedidos} {activeDay.pedidos === 1 ? 'pedido' : 'pedidos'}</p>
        </div>
      )}
    </div>
  );
}
