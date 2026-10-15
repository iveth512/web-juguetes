'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import type { ProductSales } from '@/types/admin';
import { CHART_COLOR } from './format';

/** Ranked horizontal bars: revenue per product, value at the tip. */
export function TopProductsChart({ products }: { products: ProductSales[] }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...products.map((p) => Number(p.ingresos)), 1);

  return (
    <ul className="space-y-3" aria-label="Productos con mas ingresos">
      {products.map((p) => {
        const value = Number(p.ingresos);
        const pct = Math.max((value / max) * 100, 0.5);
        const isActive = active === p.product_id;
        return (
          <li
            key={p.product_id}
            tabIndex={0}
            onPointerEnter={() => setActive(p.product_id)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(p.product_id)}
            onBlur={() => setActive(null)}
            aria-label={`${p.nombre}: ${formatPrice(value)}, ${p.unidades} unidades en ${p.pedidos} pedidos`}
            className="relative grid grid-cols-[minmax(0,10rem)_1fr] sm:grid-cols-[minmax(0,14rem)_1fr] items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <span className="truncate text-sm text-[var(--color-text)]" title={p.nombre}>{p.nombre}</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-3.5 flex-1 min-w-0">
                <div
                  className="h-full transition-opacity"
                  style={{
                    width: `${pct}%`,
                    background: CHART_COLOR,
                    borderRadius: '0 4px 4px 0',
                    opacity: active === null || isActive ? 1 : 0.45,
                  }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs tabular-nums text-[var(--color-text)]">
                {formatPrice(value)}
              </span>
            </div>
            {isActive && (
              <div className="pointer-events-none absolute right-0 -top-14 z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs shadow-lg">
                <strong className="text-sm text-[var(--color-text)]">{formatPrice(value)}</strong>
                <span className="text-[var(--color-text-muted)]"> · {p.unidades} und. · {p.pedidos} {p.pedidos === 1 ? 'pedido' : 'pedidos'} · {p.sku}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
