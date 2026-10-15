'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminShell, adminCardClass, adminInputClass } from '@/components/admin/AdminShell';
import { SalesByDayChart } from '@/components/admin/charts/SalesByDayChart';
import { TopProductsChart } from '@/components/admin/charts/TopProductsChart';
import { formatDay } from '@/components/admin/charts/format';
import { adminListOrders, getDashboardSummary, getSalesByDay, getSalesByProduct } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { AdminOrderPage, DashboardSummary, DateRange, SalesByDay, SalesByProduct } from '@/types/admin';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/types/product';

const PAGE_SIZE = 24;

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function presetRange(preset: string): DateRange {
  const today = new Date();
  const start = new Date(today);
  if (preset === 'mes') start.setDate(1);
  else start.setDate(today.getDate() - (Number(preset) - 1));
  return { desde: isoDate(start), hasta: isoDate(today) };
}

const PRESETS = [
  { key: '7', label: '7 dias' },
  { key: '30', label: '30 días' },
  { key: '90', label: '90 dias' },
  { key: 'mes', label: 'Este mes' },
];

const PAYMENT_LABELS: Record<string, string> = { CARD: 'Tarjeta', PSE: 'PSE' };

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${adminCardClass} p-4`}>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

function AlertTile({ label, count, href }: { label: string; count: number; href?: string }) {
  const body = (
    <div className={`${adminCardClass} flex items-center justify-between gap-3 px-4 py-3 ${count > 0 ? '' : 'opacity-70'}`}>
      <span className="text-sm text-[var(--color-text)]">{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ${count > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-[var(--color-bg-alt)] text-[var(--color-text-muted)]'}`}>
        {count}
      </span>
    </div>
  );
  return href && count > 0 ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className={`${adminCardClass} p-5`}>
      <h2 className="font-heading text-lg font-bold text-[var(--color-text)]">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      {children}
    </section>
  );
}

function SalesHistory({ range }: { range: DateRange }) {
  const [estado, setEstado] = useState('ventas');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Results remember the query they answer, so stale ones never show as current.
  const [result, setResult] = useState<{ key: string; data?: AdminOrderPage; error?: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const key = JSON.stringify([range, estado, search, page]);
  useEffect(() => {
    let cancelled = false;
    adminListOrders({ ...range, estado, q: search, page })
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((err: unknown) => !cancelled && setResult({
        key, error: err instanceof Error ? err.message : 'No se pudo cargar el historial.',
      }));
    return () => { cancelled = true; };
  }, [key, range, estado, search, page]);

  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? '';
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <Panel title="Historial de ventas" subtitle="Pedidos del periodo seleccionado, del mas reciente al mas antiguo.">
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, correo o # de pedido" aria-label="Buscar pedidos" className={`${adminInputClass} md:max-w-sm`} />
        <select aria-label="Estado" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className={`${adminInputClass} md:w-80`}>
          <option value="ventas">Ventas (pagados, enviados, entregados)</option>
          <option value="paid">Pagados por despachar</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="pending">Pendientes de pago</option>
          <option value="cancelled">Cancelados</option>
          <option value="refunded">Reembolsados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-3 py-2 font-semibold">Pedido</th>
              <th className="px-3 py-2 font-semibold">Fecha</th>
              <th className="px-3 py-2 font-semibold">Cliente</th>
              <th className="px-3 py-2 font-semibold">Productos</th>
              <th className="px-3 py-2 font-semibold">Pago</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && [1, 2, 3].map((i) => (
              <tr key={i}><td colSpan={7} className="px-3 py-2"><div className="h-8 animate-pulse rounded bg-[var(--color-bg-alt)]" /></td></tr>
            ))}
            {data?.results.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-[var(--color-text-muted)]">No hay pedidos en este periodo con esos filtros.</td></tr>
            )}
            {data?.results.map((o) => (
              <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0 align-top">
                <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-text)] whitespace-nowrap">
                  #{o.id.slice(0, 8).toUpperCase()}
                  {o.requires_attention && <span className="ml-1 rounded bg-yellow-100 px-1 text-[10px] font-sans font-semibold text-yellow-800" title="Requiere revision">!</span>}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-[var(--color-text-muted)]">
                  {new Date(o.sold_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-[var(--color-text)]">{o.cliente_nombre}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{o.cliente_email}</p>
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] min-w-[180px]">
                  {o.productos.map((p, i) => (
                    <p key={i}>{p.cantidad}× {p.nombre}{p.variante ? ` (${p.variante})` : ''}</p>
                  ))}
                </td>
                <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{PAYMENT_LABELS[o.metodo_pago] ?? (o.metodo_pago || '—')}</td>
                <td className="px-3 py-2.5">
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[o.status] ?? ''}`}>
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap text-[var(--color-text)]">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>{data.count} pedidos</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Anterior</button>
            <span>Pagina {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Dashboard() {
  const [preset, setPreset] = useState('30');
  const [range, setRange] = useState<DateRange>(() => presetRange('30'));
  const [draft, setDraft] = useState<DateRange>(range);
  const [rangeError, setRangeError] = useState('');

  const [showDayTable, setShowDayTable] = useState(false);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    summary?: DashboardSummary;
    byDay?: SalesByDay;
    byProduct?: SalesByProduct;
    error?: string;
  } | null>(null);

  const key = JSON.stringify([range, retry]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardSummary(range), getSalesByDay(range), getSalesByProduct({ ...range, limite: 10 })])
      .then(([summary, byDay, byProduct]) => !cancelled && setResult({ key, summary, byDay, byProduct }))
      .catch((err: unknown) => !cancelled && setResult({
        key, error: err instanceof Error ? err.message : 'No se pudo cargar el dashboard.',
      }));
    return () => { cancelled = true; };
  }, [key, range]);

  const current = result?.key === key ? result : null;
  const summary = current?.summary ?? null;
  const byDay = current?.byDay ?? null;
  const byProduct = current?.byProduct ?? null;
  const error = current?.error ?? '';
  const load = () => setRetry((n) => n + 1);

  const choosePreset = (key: string) => {
    const r = presetRange(key);
    setPreset(key);
    setDraft(r);
    setRange(r);
    setRangeError('');
  };

  const applyCustom = () => {
    if (!draft.desde || !draft.hasta) return setRangeError('Elige ambas fechas.');
    if (draft.desde > draft.hasta) return setRangeError('La fecha inicial no puede ser posterior a la final.');
    setRangeError('');
    setPreset('');
    setRange({ ...draft });
  };

  const rangeLabel = useMemo(() => `${formatDay(range.desde, true)} – ${formatDay(range.hasta, true)}`, [range]);
  const hasSales = (summary?.pedidos ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Filters: one row, above everything they control */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={preset === p.key}
              onClick={() => choosePreset(p.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${preset === p.key ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-[var(--color-text-muted)]">
            Desde
            <input type="date" value={draft.desde} max={draft.hasta} onChange={(e) => setDraft((d) => ({ ...d, desde: e.target.value }))} className={`${adminInputClass} mt-1 w-40`} />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Hasta
            <input type="date" value={draft.hasta} min={draft.desde} onChange={(e) => setDraft((d) => ({ ...d, hasta: e.target.value }))} className={`${adminInputClass} mt-1 w-40`} />
          </label>
          <button type="button" onClick={applyCustom} className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]">
            Aplicar
          </button>
        </div>
      </div>
      {rangeError && <p className="text-sm text-red-600" role="alert">{rangeError}</p>}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error} <button type="button" onClick={load} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {/* Headline + stat tiles */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_2fr]">
        <div className={`${adminCardClass} p-5`}>
          <p className="text-sm text-[var(--color-text-muted)]">Ventas del periodo</p>
          <p className="mt-1 text-5xl font-semibold tabular-nums text-[var(--color-text)]">
            {summary ? formatPrice(summary.ventas_total) : <span className="inline-block h-12 w-56 animate-pulse rounded bg-[var(--color-bg-alt)]" />}
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">{rangeLabel} · pedidos pagados, enviados o entregados</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="Pedidos" value={summary ? String(summary.pedidos) : '—'} />
          <StatTile label="Ticket promedio" value={summary ? formatPrice(summary.ticket_promedio) : '—'} />
          <StatTile label="Unidades vendidas" value={summary ? String(summary.unidades_vendidas) : '—'} />
          <StatTile label="Clientes" value={summary ? String(summary.clientes) : '—'} hint="Compradores distintos" />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AlertTile label="Por despachar" count={summary.pedidos_por_despachar} />
          <AlertTile label="Pendientes de pago" count={summary.pedidos_pendientes_pago} />
          <AlertTile label="Requieren revision" count={summary.pedidos_requieren_atencion} />
          <AlertTile label="Productos con stock bajo" count={summary.productos_bajo_stock} href="/panel/productos?estado=bajo_stock" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Panel title="Ventas por dia" subtitle={`Total vendido cada dia (COP) · ${rangeLabel}`}>
          {!byDay ? (
            <div className="h-60 animate-pulse rounded bg-[var(--color-bg-alt)]" />
          ) : (
            <>
              <SalesByDayChart days={byDay.dias} />
              <button type="button" onClick={() => setShowDayTable((v) => !v)} className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline" aria-expanded={showDayTable}>
                {showDayTable ? 'Ocultar tabla' : 'Ver como tabla'}
              </button>
              {showDayTable && (
                <div className="mt-2 max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--color-text-muted)]">
                        <th className="py-1.5 font-semibold">Dia</th>
                        <th className="py-1.5 font-semibold text-right">Pedidos</th>
                        <th className="py-1.5 font-semibold text-right">Ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDay.dias.map((d) => (
                        <tr key={d.fecha} className="border-t border-[var(--color-border)]">
                          <td className="py-1.5 text-[var(--color-text)]">{formatDay(d.fecha, true)}</td>
                          <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{d.pedidos}</td>
                          <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{formatPrice(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Panel>

        <Panel title="Ventas por producto" subtitle="Top 10 por ingresos (precio de venta × unidades, antes de descuentos y envio)">
          {!byProduct ? (
            <div className="h-60 animate-pulse rounded bg-[var(--color-bg-alt)]" />
          ) : byProduct.productos.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">Sin ventas en este periodo.</p>
          ) : (
            <>
              <TopProductsChart products={byProduct.productos} />
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Ventas por producto</caption>
                <thead>
                  <tr className="text-left text-xs text-[var(--color-text-muted)]">
                    <th className="py-1.5 font-semibold">Producto</th>
                    <th className="py-1.5 font-semibold text-right">Unidades</th>
                    <th className="py-1.5 font-semibold text-right">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.productos.map((p) => (
                    <tr key={p.product_id} className="border-t border-[var(--color-border)]">
                      <td className="py-1.5 pr-2 text-[var(--color-text)]">
                        <Link href={`/panel/productos/${p.product_id}`} className="hover:text-[var(--color-primary)]">{p.nombre}</Link>
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{p.unidades}</td>
                      <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{p.pedidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>
      </div>

      {summary && !hasSales && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Aun no hay ventas en este periodo. Cuando se aprueben pagos con Bold apareceran aqui automaticamente.
        </p>
      )}

      <SalesHistory key={`${range.desde}_${range.hasta}`} range={range} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard de ventas">
      <Dashboard />
    </AdminShell>
  );
}
