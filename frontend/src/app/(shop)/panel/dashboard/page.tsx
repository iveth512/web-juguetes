'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminShell, adminInputClass } from '@/components/admin/AdminShell';
import { ChartMotion, GROUNDS, containerClass, type Ground } from '@/components/admin/insights/InsightCard';
import { chartTokens } from '@/components/admin/insights/charts';
import { SalesByDayChart } from '@/components/admin/charts/SalesByDayChart';
import { TopProductsChart } from '@/components/admin/charts/TopProductsChart';
import { formatDay } from '@/components/admin/charts/format';
import { ApiError, adminListOrders, adminUpdateOrder, getDashboardSummary, getSalesByDay, getSalesByProduct } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import type { AdminOrder, AdminOrderPage, DashboardSummary, DateRange, SalesByDay, SalesByProduct } from '@/types/admin';
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

// "Últimos N días" rolls back from today; the month preset is named so it can't be confused with 30 días.
const MONTH_NAME = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date());
const PRESETS = [
  { key: '7', label: 'Últimos 7 días' },
  { key: '30', label: 'Últimos 30 días' },
  { key: '90', label: 'Últimos 90 días' },
  { key: 'mes', label: MONTH_NAME.charAt(0).toUpperCase() + MONTH_NAME.slice(1), hint: `Desde el 1 de ${MONTH_NAME} hasta hoy` },
];

const PAYMENT_LABELS: Record<string, string> = { CARD: 'Tarjeta', PSE: 'PSE' };

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-base text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1">
        <span className="block text-[clamp(1.75rem,2.6vw,2.5rem)] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--color-text)]">{value}</span>
        {hint && <span className="mt-2 block text-sm text-[var(--color-text-muted)]">{hint}</span>}
      </dd>
    </div>
  );
}

function Alert({ label, count, href }: { label: string; count: number; href?: string }) {
  const body = (
    <>
      <span className={`text-3xl font-semibold tabular-nums ${count > 0 ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-text-muted)]'}`}>{count}</span>
      <span className="text-base text-[var(--color-text)]">{label}</span>
    </>
  );
  return (
    <li>
      {href && count > 0
        ? <Link href={href} className="inline-flex min-h-11 items-baseline gap-2 underline-offset-4 hover:underline">{body}</Link>
        : <span className="inline-flex min-h-11 items-baseline gap-2">{body}</span>}
    </li>
  );
}

function Section({ id, title, subtitle, ground, children }: {
  id: string; title: string; subtitle?: string; ground: Ground; children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn('py-20 md:py-24', GROUNDS[ground])}>
      <div className={containerClass}>
        <h2 id={id} className="type-section text-[var(--color-text)]">{title}</h2>
        {subtitle && <p className="mt-3 max-w-[70ch] text-base text-[var(--color-text-muted)]">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

const toggleClass =
  'mt-4 inline-flex min-h-11 items-center text-base font-semibold text-[var(--color-primary-text)] underline-offset-4 hover:underline';

function EmptyChart({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-10">
      <p className="text-lg font-semibold text-[var(--color-text)]">{title}</p>
      {hint && <p className="mt-1 text-base text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

function OrderAction({ order, onUpdated }: { order: AdminOrder; onUpdated: (o: AdminOrder) => void }) {
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState('');

  const status = done ? <p className="text-xs font-semibold text-[var(--color-text)]" role="status">{done}</p> : null;
  if (order.status !== 'paid' && order.status !== 'shipped') return status;

  const submit = async (next: 'shipped' | 'delivered') => {
    setBusy(true);
    setErrors({});
    try {
      const updated = await adminUpdateOrder(order.id, next === 'shipped'
        ? { status: next, ...(carrier.trim() && { shipping_carrier: carrier.trim() }), ...(tracking.trim() && { tracking_number: tracking.trim() }) }
        : { status: next });
      setOpen(false);
      setDone(next === 'shipped' ? 'Marcado como enviado.' : 'Marcado como entregado.');
      onUpdated(updated);
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : {};
      setErrors(Object.keys(fields).length ? fields : { detail: err instanceof Error ? err.message : 'No se pudo actualizar el pedido.' });
    } finally {
      setBusy(false);
    }
  };

  const buttonClass = 'min-h-9 whitespace-nowrap rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-50';
  const fieldError = (name: string) => errors[name] && <p className="mt-1 text-xs text-[var(--color-error)]">{errors[name]}</p>;
  const generalError = Object.entries(errors).find(([k]) => k !== 'shipping_carrier' && k !== 'tracking_number')?.[1];

  return (
    <div className="min-w-[11rem] space-y-1.5">
      {status}
      {order.status === 'shipped' ? (
        <button type="button" disabled={busy} onClick={() => submit('delivered')} className={buttonClass}>
          {busy ? 'Guardando…' : 'Marcar entregado'}
        </button>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonClass}>Marcar enviado</button>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit('shipped'); }} className="space-y-1.5">
          <label className="block text-xs text-[var(--color-text-muted)]">
            Transportadora (opcional)
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={100} aria-invalid={Boolean(errors.shipping_carrier)} className={`${adminInputClass} mt-0.5 py-1.5 text-sm`} />
          </label>
          {fieldError('shipping_carrier')}
          <label className="block text-xs text-[var(--color-text-muted)]">
            Número de guía (opcional)
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={100} aria-invalid={Boolean(errors.tracking_number)} className={`${adminInputClass} mt-0.5 py-1.5 text-sm`} />
          </label>
          {fieldError('tracking_number')}
          <div className="flex gap-1.5">
            <button type="submit" disabled={busy} className={`${buttonClass} !border-[var(--color-primary)] !bg-[var(--color-primary)] !text-[var(--color-on-primary)]`}>
              {busy ? 'Guardando…' : 'Confirmar envío'}
            </button>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setErrors({}); }} className={buttonClass}>Cancelar</button>
          </div>
        </form>
      )}
      {generalError && <p className="text-xs text-[var(--color-error)]" role="alert">{generalError}</p>}
    </div>
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
  const replaceOrder = (updated: AdminOrder) => setResult((r) => (r?.data
    ? { ...r, data: { ...r.data, results: r.data.results.map((o) => (o.id === updated.id ? updated : o)) } }
    : r));
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <Section id="dash-historial" ground="paper" title="Historial de ventas" subtitle="Pedidos del periodo seleccionado, del más reciente al más antiguo. Las ventas son pedidos pagados, enviados o entregados.">
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, correo o # de pedido" aria-label="Buscar pedidos" className={`${adminInputClass} md:max-w-sm`} />
        <select aria-label="Estado" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className={`${adminInputClass} md:w-64`}>
          <option value="ventas">Todas las ventas</option>
          <option value="paid">Pagados por despachar</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="pending">Pendientes de pago</option>
          <option value="cancelled">Cancelados</option>
          <option value="refunded">Reembolsados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {error && <p role="alert" className="mb-4 text-base font-semibold text-[var(--color-error)]">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-sm font-medium text-[var(--color-text-muted)]">
              <th className="px-3 py-2 font-semibold">Pedido</th>
              <th className="px-3 py-2 font-semibold">Fecha</th>
              <th className="px-3 py-2 font-semibold">Cliente</th>
              <th className="px-3 py-2 font-semibold">Productos</th>
              <th className="px-3 py-2 font-semibold">Pago</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold text-right">Total</th>
              <th className="px-3 py-2 font-semibold">Despacho</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && [1, 2, 3].map((i) => (
              <tr key={i}><td colSpan={8} className="px-3 py-2"><div className="h-8 animate-pulse rounded bg-[var(--color-bg-alt)]" /></td></tr>
            ))}
            {data?.results.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-[var(--color-text-muted)]">No hay pedidos en este periodo con esos filtros.</td></tr>
            )}
            {data?.results.map((o) => (
              <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0 align-top">
                <td className="px-3 py-2.5 text-sm font-semibold tabular-nums text-[var(--color-text)] whitespace-nowrap">
                  #{o.id.slice(0, 8).toUpperCase()}
                  {o.requires_attention && <span className="ml-1 rounded bg-yellow-100 px-1 text-[10px] font-sans font-semibold text-yellow-800" title="Requiere revisión">!</span>}
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
                <td className="px-3 py-2.5">
                  {o.tracking_number && <p className="mb-1 whitespace-nowrap text-xs text-[var(--color-text-muted)]">Guía {o.tracking_number}</p>}
                  <OrderAction order={o} onUpdated={replaceOrder} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>{data.count} pedidos</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-11 rounded-full border border-[var(--color-border)] px-4 font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40">Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="min-h-11 rounded-full border border-[var(--color-border)] px-4 font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </Section>
  );
}

function Dashboard() {
  const [preset, setPreset] = useState('30');
  const [range, setRange] = useState<DateRange>(() => presetRange('30'));
  const [draft, setDraft] = useState<DateRange>(range);
  const [rangeError, setRangeError] = useState('');

  const [showDayTable, setShowDayTable] = useState(false);
  const [showProductTable, setShowProductTable] = useState(false);
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

  const pillClass = 'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors';
  const idleClass = 'bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:bg-[#E6E1F4] dark:hover:bg-[#1D1245]';

  const dayTable = byDay && (
    <div className="mt-2 max-h-72 max-w-3xl overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[var(--color-text-muted)]">
            <th className="py-1.5 font-semibold">Día</th>
            <th className="py-1.5 font-semibold text-right">Pedidos</th>
            <th className="py-1.5 font-semibold text-right">Ventas netas</th>
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
  );

  return (
    <div className={chartTokens.varsClass}>
      <ChartMotion />
      <header className={cn('pb-20 pt-12 md:pb-24 md:pt-16', GROUNDS.paper)}>
        <div className={containerClass}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <h1 className="type-page text-[var(--color-text)]">Dashboard de ventas</h1>
            {/* Filters: one row, above everything they control */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={preset === p.key}
                    title={'hint' in p ? p.hint : undefined}
                    onClick={() => choosePreset(p.key)}
                    className={cn(pillClass, preset === p.key ? 'bg-[var(--color-secondary)] text-white dark:bg-[var(--color-primary)] dark:text-[var(--color-on-primary)]' : idleClass)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm text-[var(--color-text-muted)]">
                  Desde
                  <input type="date" value={draft.desde} max={draft.hasta} onChange={(e) => setDraft((d) => ({ ...d, desde: e.target.value }))} className={`${adminInputClass} mt-1 w-40`} />
                </label>
                <label className="text-sm text-[var(--color-text-muted)]">
                  Hasta
                  <input type="date" value={draft.hasta} min={draft.desde} onChange={(e) => setDraft((d) => ({ ...d, hasta: e.target.value }))} className={`${adminInputClass} mt-1 w-40`} />
                </label>
                <button type="button" onClick={applyCustom} className={cn(pillClass, 'px-5', idleClass)}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
          {rangeError && <p className="mt-3 text-sm text-[var(--color-error)]" role="alert">{rangeError}</p>}
          {error && (
            <p role="alert" className="mt-6 text-base text-[var(--color-text)]">
              <strong className="font-semibold text-[var(--color-error)]">{error}</strong>{' '}
              <button type="button" onClick={load} className="min-h-11 font-semibold text-[var(--color-primary-text)] underline underline-offset-4">Reintentar</button>
            </p>
          )}

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
            <div className="min-w-0">
              <p className="text-lg text-[var(--color-text)]">Ventas netas</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.9] tabular-nums text-[var(--color-text)]">
                {summary ? formatPrice(summary.ventas_total) : <span className="inline-block h-24 w-72 max-w-full animate-pulse rounded bg-[var(--color-bg-alt)] align-bottom" />}
              </p>
              {summary && (
                <dl className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-base text-[var(--color-text-muted)]">
                  <div className="flex gap-1.5">
                    <dt>Productos</dt>
                    <dd className="tabular-nums text-[var(--color-text)]">{formatPrice(Number(summary.ventas_total) + Number(summary.descuentos))}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>− Descuentos</dt>
                    <dd className="tabular-nums text-[var(--color-text)]">{formatPrice(summary.descuentos)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>· Envío cobrado</dt>
                    <dd className="tabular-nums text-[var(--color-text)]">{formatPrice(summary.envios_cobrados)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>· Total cobrado</dt>
                    <dd className="font-semibold tabular-nums text-[var(--color-text)]">{formatPrice(summary.total_cobrado)}</dd>
                  </div>
                </dl>
              )}
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{rangeLabel} · productos de pedidos pagados, enviados o entregados, con descuentos y sin envío</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-10 gap-y-8">
              <Figure label="Pedidos" value={summary ? String(summary.pedidos) : '—'} />
              <Figure label="Ticket promedio" value={summary ? formatPrice(summary.ticket_promedio) : '—'} hint="Ventas netas por pedido" />
              <Figure label="Unidades vendidas" value={summary ? String(summary.unidades_vendidas) : '—'} />
              <Figure label="Clientes" value={summary ? String(summary.clientes) : '—'} hint="Compradores distintos" />
            </dl>
          </div>

          {summary && (
            <ul aria-label="Pendientes" className="mt-14 flex flex-wrap gap-x-10 gap-y-2">
              <Alert label="por despachar" count={summary.pedidos_por_despachar} />
              <Alert label="pendientes de pago" count={summary.pedidos_pendientes_pago} />
              <Alert label="requieren revisión" count={summary.pedidos_requieren_atencion} />
              <Alert label="productos con stock bajo" count={summary.productos_bajo_stock} href="/panel/productos?estado=bajo_stock" />
            </ul>
          )}
        </div>
      </header>

      <Section id="dash-dias" ground="field" title="Ventas por día" subtitle={`Ventas netas de cada día (COP, con descuentos y sin envío) · ${rangeLabel}. En naranja, el mejor día.`}>
        {!byDay ? (
          <div className="h-60 animate-pulse rounded bg-[var(--ins-ctx)] opacity-40" />
        ) : !byDay.dias.some((d) => Number(d.total) > 0) ? (
          <EmptyChart title="Aún no hay ventas en este periodo." hint="Cuando entren pedidos pagados aparecerán aquí." />
        ) : (
          <>
            <SalesByDayChart days={byDay.dias} />
            <button type="button" onClick={() => setShowDayTable((v) => !v)} className={toggleClass} aria-expanded={showDayTable}>
              {showDayTable ? 'Ocultar tabla' : 'Ver como tabla'}
            </button>
            {showDayTable && dayTable}
          </>
        )}
      </Section>

      <section aria-labelledby="dash-productos" className={cn('py-20 md:py-24', GROUNDS.stage)}>
        <div className={cn(containerClass, 'grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16')}>
          <div>
            <h2 id="dash-productos" className="type-section text-[var(--color-text)]">Ventas por producto</h2>
            <p className="mt-3 max-w-[40ch] text-base text-[var(--color-text-muted)]">Top 10 por ingresos (precio de venta × unidades, antes de descuentos y envío). En naranja, el que más vende.</p>
          </div>
          <div className="min-w-0">
            {!byProduct ? (
              <div className="h-60 animate-pulse rounded bg-[var(--ins-ctx)] opacity-40" />
            ) : byProduct.productos.length === 0 ? (
              <EmptyChart title="Ningún producto vendido en este periodo." />
            ) : (
              <>
                <TopProductsChart products={byProduct.productos} />
                <button type="button" onClick={() => setShowProductTable((v) => !v)} className={toggleClass} aria-expanded={showProductTable}>
                  {showProductTable ? 'Ocultar tabla' : 'Ver como tabla'}
                </button>
                {showProductTable && (
                  <table className="mt-2 w-full text-sm">
                    <caption className="sr-only">Ventas por producto</caption>
                    <thead>
                      <tr className="text-left text-xs text-[var(--color-text-muted)]">
                        <th className="py-1.5 font-semibold">Producto</th>
                        <th className="py-1.5 font-semibold text-right">Unidades</th>
                        <th className="py-1.5 font-semibold text-right">Pedidos</th>
                        <th className="py-1.5 font-semibold text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byProduct.productos.map((p) => (
                        <tr key={p.product_id} className="border-t border-[var(--color-border)]">
                          <td className="py-1.5 pr-2 text-[var(--color-text)]">
                            <Link href={`/panel/productos/${p.product_id}`} className="hover:text-[var(--color-primary-text)] hover:underline">{p.nombre}</Link>
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{p.unidades}</td>
                          <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{p.pedidos}</td>
                          <td className="py-1.5 text-right tabular-nums text-[var(--color-text)]">{formatPrice(p.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <SalesHistory key={`${range.desde}_${range.hasta}`} range={range} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard de ventas" bleed>
      <Dashboard />
    </AdminShell>
  );
}
