'use client';

import { useMemo, useState } from 'react';
import { adminCardClass, adminInputClass } from '@/components/admin/AdminShell';
import { formatDay } from '@/components/admin/charts/format';
import { formatPrice } from '@/lib/utils';
import type { AdminOrder, AdminProduct, DateRange, SalesByProduct } from '@/types/admin';
import { BarChart, Delta, Dumbbell, Histogram, Legend, SplitBar, StatTile, chartTokens } from './charts';
import {
  FREE_SHIPPING_THRESHOLD, STOCKOUT_HORIZON_DAYS, WEEKDAYS, WEEKDAYS_LONG, WEEKDAYS_ONE,
  cities, dormantInventory, kpis, formatPct, franchises, pareto, peakBlock, pct, rangeDays, repeatCustomers,
  shippingThreshold, soldNameSet, stockCoverage, timing,
} from './compute';
import { DataTable, InsightCard, InsightSkeleton } from './InsightCard';
import { useInsightsData } from './useInsightsData';

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function presetRange(days: number): DateRange {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  return { desde: isoDate(start), hasta: isoDate(today) };
}

const PRESETS = [7, 30, 90];
const MIN_ORDERS_FOR_PATTERNS = 10;
// Every product is a Funko Pop!, so charts drop the shared prefix to keep names readable.
const short = (name: string) => name.replace(/^Funko Pop!\s*/i, '');
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;

// ---------- KPI tiles ----------

function Comparison({ now, before, days }: { now: number; before: number | undefined; days: number }) {
  if (before === undefined) return <p className="mt-2 h-4" />;
  if (before === 0) {
    return <p className="mt-2 text-xs text-[var(--color-text-muted)]">{now > 0 ? `Sin ventas en los ${days} días anteriores` : 'Igual que el periodo anterior'}</p>;
  }
  return <Delta change={((now - before) / before) * 100} suffix={`vs. ${days} días anteriores`} />;
}

function KpiRow({ orders, prevOrders, days }: { orders: AdminOrder[]; prevOrders?: AdminOrder[]; days: number }) {
  const now = kpis(orders);
  const prev = prevOrders ? kpis(prevOrders) : undefined;
  const repeat = repeatCustomers(orders);
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatTile label="Ingresos por productos" value={formatPrice(now.revenue)}>
        <Comparison now={now.revenue} before={prev?.revenue} days={days} />
      </StatTile>
      <StatTile label="Pedidos" value={now.orders.toLocaleString('es-CO')}>
        <Comparison now={now.orders} before={prev?.orders} days={days} />
      </StatTile>
      <StatTile label="Ticket promedio" value={formatPrice(now.avgTicket)}>
        <Comparison now={now.avgTicket} before={prev?.avgTicket} days={days} />
      </StatTile>
      <StatTile label="Clientes que repiten" value={repeat.customers ? `${repeat.repeat} de ${repeat.customers}` : '—'}>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {repeat.customers ? `Dejan el ${formatPct(repeat.repeatRevenueShare)} de los ingresos` : 'Sin compradores en el periodo'}
        </p>
      </StatTile>
    </div>
  );
}

// ---------- Insights ----------

function Insights({ range, orders, products, byProduct }: {
  range: DateRange; orders: AdminOrder[]; products: AdminProduct[]; byProduct: SalesByProduct;
}) {
  const days = rangeDays(range);
  const top = byProduct.productos;
  const soldNames = useMemo(() => soldNameSet(orders), [orders]);
  const soldIds = useMemo(() => new Set(top.map((p) => p.product_id)), [top]);
  const activeCount = products.filter((p) => p.is_active).length;

  const dormant = dormantInventory(products, soldIds, soldNames);
  const coverage = stockCoverage(orders, products, range, top);
  const shipping = shippingThreshold(orders, products, soldNames);
  const concentration = pareto(top, orders, activeCount, soldNames);
  const franchiseRows = franchises(products, top);
  const time = timing(orders);
  const cityRows = cities(orders);

  // 1. Dormant inventory
  const dormantShare = pct(dormant.dormantValue, dormant.totalStockValue);
  const dormantTop = dormant.items.slice(0, 8);
  const dormantCard = (
    <InsightCard
      id="ins-dormido"
      headline={dormant.dormantCount
        ? `${dormant.dormantCount} de tus ${dormant.activeCount} productos no vendieron ni una unidad: ${formatPrice(dormant.dormantValue)} quietos en bodega`
        : 'Todos tus productos con stock vendieron al menos una unidad'}
      context={dormant.dormantCount ? (
        <>Son {plural(dormant.dormantUnits, 'unidad', 'unidades')} sin movimiento en {days} días: el {formatPct(dormantShare)} del valor de tu inventario, a precio de venta.</>
      ) : undefined}
      action="Arma combos o un descuento por tiempo limitado con los primeros de la lista y no recompres esas referencias hasta que roten."
      empty={dormant.dormantCount ? undefined : 'No hay inventario dormido en este periodo.'}
      table={<DataTable caption="Productos sin ventas en el periodo" head={['Producto', 'Stock', 'Valor']} rows={dormant.items.map((d) => [d.name, d.stock, formatPrice(d.value)])} />}
    >
      <SplitBar
        part={dormant.dormantValue}
        whole={dormant.totalStockValue}
        partLabel={`Sin ventas: ${formatPrice(dormant.dormantValue)}`}
        restLabel={`Con ventas: ${formatPrice(dormant.totalStockValue - dormant.dormantValue)}`}
        ariaLabel={`El ${formatPct(dormantShare)} del valor del inventario está en productos sin ventas`}
      />
      <p className="mb-3 mt-6 text-sm font-semibold text-[var(--color-text)]">Dónde está el dinero quieto</p>
      <BarChart
        ariaLabel="Productos sin ventas con más dinero en inventario"
        rows={dormantTop.map((d) => ({ key: d.id, label: short(d.name), value: d.value, valueLabel: formatPrice(d.value), tone: 'hi', detail: `${plural(d.stock, 'unidad', 'unidades')} en stock` }))}
      />
      {dormant.items.length > dormantTop.length && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          y {plural(dormant.items.length - dormantTop.length, 'producto más', 'productos más')} por {formatPrice(dormant.items.slice(dormantTop.length).reduce((s, d) => s + d.value, 0))}
        </p>
      )}
    </InsightCard>
  );

  // 2. Stock-out risk
  const firstRisk = coverage.items[0];
  const daysLabel = (d: number, stock: number) => (stock <= 0 ? 'Agotado' : `~${Math.round(d)} días`);
  const coverageCard = (
    <InsightCard
      id="ins-agotarse"
      headline={!firstRisk ? 'Aún no hay ventas recientes para medir la cobertura'
        : coverage.atRisk.length
          ? `${short(firstRisk.name)} ${firstRisk.stock <= 0 ? 'ya está agotado' : `se agota en ~${Math.round(firstRisk.days)} días`}${coverage.atRisk.length > 1 ? ` y ${plural(coverage.atRisk.length - 1, 'éxito más baja', 'éxitos más bajan')} de ${STOCKOUT_HORIZON_DAYS} días` : ''}`
          : `Ningún éxito de ventas se agota antes de ${STOCKOUT_HORIZON_DAYS} días; el más justo es ${short(firstRisk.name)} (~${Math.round(firstRisk.days)} días)`}
      context={<>Cobertura = stock actual ÷ ritmo de venta de los últimos {coverage.windowDays} días. Tus productos más vendidos, del más urgente al más holgado.</>}
      action={coverage.atRisk.length
        ? `Pide ya la reposición de ${coverage.atRisk.slice(0, 3).map((i) => short(i.name)).join(', ')}: si la importación tarda más que su cobertura, te quedas sin tus productos estrella.`
        : `Revisa esta lista cada semana y repón cuando un producto baje de ${STOCKOUT_HORIZON_DAYS} días de cobertura.`}
      empty={firstRisk ? undefined : `No hubo ventas en los últimos ${coverage.windowDays} días del periodo.`}
      table={<DataTable caption="Cobertura de stock" head={['Producto', 'Stock', `Vendidas (${coverage.windowDays} d)`, 'Cobertura']} rows={coverage.items.map((i) => [i.name, i.stock, i.units, daysLabel(i.days, i.stock)])} />}
    >
      <BarChart
        ariaLabel={`Días de cobertura por producto; ${coverage.atRisk.length} por debajo de ${STOCKOUT_HORIZON_DAYS} días`}
        max={120}
        marker={{ value: STOCKOUT_HORIZON_DAYS, label: `${STOCKOUT_HORIZON_DAYS} días` }}
        rows={coverage.items.slice(0, 10).map((i) => ({
          key: i.id,
          label: short(i.name),
          value: Math.min(i.days, 120),
          valueLabel: daysLabel(i.days, i.stock),
          tone: i.days < STOCKOUT_HORIZON_DAYS ? 'hi' : 'ctx',
          detail: `${plural(i.stock, 'unidad', 'unidades')} en stock · ${plural(i.units, 'vendida', 'vendidas')} en ${coverage.windowDays} días`,
        }))}
      />
    </InsightCard>
  );

  // 3. Free-shipping threshold
  const gap = FREE_SHIPPING_THRESHOLD - shipping.nearFrom;
  const thresholdIndex = shipping.bins.findIndex((b) => b.from >= FREE_SHIPPING_THRESHOLD);
  const shippingCard = (
    <InsightCard
      id="ins-envio"
      headline={shipping.near
        ? `${plural(shipping.near, 'pedido', 'pedidos')} (${formatPct(pct(shipping.near, shipping.orders))}) se quedaron a menos de ${formatPrice(gap)} del envío gratis`
        : `Ningún pedido quedó a menos de ${formatPrice(gap)} del envío gratis`}
      context={<>El envío es gratis desde {formatPrice(FREE_SHIPPING_THRESHOLD)} y un Funko típico cuesta {formatPrice(shipping.typicalPrice)}: a esos clientes les faltaba un solo producto{shipping.nearShippingPaid > 0 ? ` y pagaron ${formatPrice(shipping.nearShippingPaid)} en envíos` : ''}. Ya califica el {formatPct(pct(shipping.qualifying, shipping.orders))} de los pedidos.</>}
      action={`Muestra en el carrito cuánto falta para el envío gratis y sugiere un Funko de unos ${formatPrice(shipping.typicalPrice)}: cada cliente que lo agregue es una venta más.`}
      empty={shipping.orders < MIN_ORDERS_FOR_PATTERNS ? `Hacen falta al menos ${MIN_ORDERS_FOR_PATTERNS} pedidos para ver cómo se reparten.` : undefined}
      table={<DataTable caption="Pedidos por valor de productos" head={['Valor de productos', 'Pedidos']} rows={shipping.bins.map((b) => [`${formatPrice(b.from)} – ${formatPrice(b.to - 1)}`, b.count])} />}
    >
      <Legend items={[
        { tone: 'hi', label: `A ${formatPrice(gap)} o menos` },
        { tone: 'second', label: 'Con envío gratis' },
        { tone: 'ctx', label: 'Resto' },
      ]} />
      <Histogram
        ariaLabel={`Pedidos por valor de productos en tramos de $50.000; ${shipping.near} justo debajo del envío gratis`}
        labelEvery={2}
        divider={thresholdIndex > 0 ? { beforeIndex: thresholdIndex, label: 'Envío gratis' } : undefined}
        data={shipping.bins.map((b) => ({
          key: String(b.from),
          label: b.from === 0 ? '0' : `${b.from / 1000} mil`,
          value: b.count,
          tone: b.zone === 'near' ? 'hi' : b.zone === 'free' ? 'second' : 'ctx',
          capLabel: b.zone === 'near' && b.count > 0 ? String(b.count) : undefined,
          title: `${formatPrice(b.from)} a ${formatPrice(b.to - 1)}: ${plural(b.count, 'pedido', 'pedidos')}`,
        }))}
      />
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">Valor de los productos del pedido, sin envío.</p>
    </InsightCard>
  );

  // 4. Concentration
  const paretoLimit = Math.min(Math.max(15, concentration.coreCount + 3), 30);
  const paretoRows = concentration.items.slice(0, paretoLimit);
  const restCount = concentration.items.length - paretoRows.length + concentration.tailCount;
  const restRevenue = concentration.items.slice(paretoLimit).reduce((s, i) => s + i.revenue, 0) + concentration.tailRevenue;
  const paretoCard = (
    <InsightCard
      id="ins-pareto"
      headline={concentration.coreCount
        ? `${concentration.coreCount} de tus ${concentration.catalogCount} productos (${formatPct(pct(concentration.coreCount, concentration.catalogCount))}) generan el ${formatPct(concentration.coreShare)} de los ingresos`
        : 'Todavía no hay ingresos para medir la concentración'}
      context={concentration.coreCount ? <>Solo {plural(concentration.soldCount, 'producto vendió', 'productos vendieron')} algo en {days} días; el resto del catálogo no aportó ingresos.</> : undefined}
      action={`Cuida el stock de esos ${concentration.coreCount}: son tu negocio. Úsalos como gancho en la portada y en anuncios, y vende con ellos los productos que no se mueven.`}
      empty={concentration.coreCount ? undefined : 'Sin ventas en el periodo.'}
      table={<DataTable caption="Ingresos por producto" head={['Producto', 'Ingresos', 'Acumulado']} rows={concentration.items.map((i) => [i.name, formatPrice(i.revenue), formatPct(i.cumulative)])} />}
    >
      <Legend items={[
        { tone: 'hi', label: `Los que suman el ${formatPct(concentration.coreShare)}` },
        { tone: 'ctx', label: 'Resto' },
      ]} />
      <BarChart
        ariaLabel={`Ingresos por producto; los ${concentration.coreCount} primeros suman el ${formatPct(concentration.coreShare)}`}
        rows={[
          ...paretoRows.map((i) => ({
            key: i.id, label: short(i.name), value: i.revenue, valueLabel: formatPrice(i.revenue),
            tone: (i.core ? 'hi' : 'ctx') as 'hi' | 'ctx', detail: `Acumulado: ${formatPct(i.cumulative)} de los ingresos`,
          })),
          ...(restCount > 0 ? [{ key: 'rest', label: `Otros ${restCount} productos`, value: restRevenue, valueLabel: formatPrice(restRevenue), tone: 'ctx' as const }] : []),
        ]}
      />
    </InsightCard>
  );

  // 5. Franchises
  const ranked = franchiseRows.filter((f) => f.products > 0 || f.revenue > 0);
  const byGap = [...ranked].sort((a, b) => b.gap - a.gap);
  const best = byGap[0];
  const worst = byGap[byGap.length - 1];
  const shown = [...byGap.slice(0, 4), ...byGap.slice(-4)].filter((f, i, arr) => arr.findIndex((x) => x.name === f.name) === i);
  const overs = byGap.filter((f) => f.gap > 0).slice(0, 2).map((f) => f.name);
  const franchiseCard = (
    <InsightCard
      id="ins-franquicias"
      headline={best && worst && best.gap > 0
        ? `${best.name} es el ${formatPct(best.catalogShare)} del catálogo y trae el ${formatPct(best.revenueShare)} de los ingresos; ${worst.name} ocupa el ${formatPct(worst.catalogShare)} y vende el ${formatPct(worst.revenueShare)}`
        : 'Aún no hay ventas para comparar franquicias'}
      context="Cada fila compara el peso de la franquicia en tu catálogo activo con su peso en los ingresos del periodo. Se muestran las que más se desvían."
      action={overs.length && worst ? `Amplía el surtido de ${overs.join(' y ')}; con ${worst.name}, no repongas hasta liquidar lo que tienes.` : undefined}
      empty={best && best.gap > 0 ? undefined : 'Sin ventas en el periodo.'}
      table={<DataTable caption="Franquicias: catálogo vs. ingresos" head={['Franquicia', 'Productos', 'Catálogo', 'Ingresos']} rows={byGap.map((f) => [f.name, f.products, formatPct(f.catalogShare), formatPct(f.revenueShare)])} />}
    >
      <Legend items={[
        { tone: 'ctx', shape: 'ring', label: 'Peso en el catálogo' },
        { tone: 'hi', shape: 'dot', label: 'Ingresos: vende más que su peso' },
        { tone: 'second', shape: 'dot', label: 'Ingresos: vende menos' },
      ]} />
      <Dumbbell
        ariaLabel={`Franquicias: ${best?.name} vende por encima de su peso en el catálogo y ${worst?.name} por debajo`}
        formatTick={formatPct}
        rows={shown.map((f) => ({
          key: f.name, label: f.name, from: f.catalogShare, to: f.revenueShare,
          detail: `${formatPct(f.catalogShare)} del catálogo (${plural(f.products, 'producto', 'productos')}), ${formatPct(f.revenueShare)} de los ingresos`,
        }))}
      />
    </InsightCard>
  );

  // 6. When they buy
  const peakDay = time.byDay.indexOf(Math.max(...time.byDay));
  const block = peakBlock(time.byHour);
  const blockHours = new Set([block.start, (block.start + 1) % 24, (block.start + 2) % 24]);
  const hourLabel = (h: number) => `${h}:00`;
  const timingCard = (
    <InsightCard
      id="ins-cuando"
      headline={`Los ${WEEKDAYS_LONG[peakDay]} traen el ${formatPct(pct(time.byDay[peakDay], orders.length))} de los pedidos; la franja más fuerte va de ${hourLabel(block.start)} a ${hourLabel((block.start + 3) % 24)}`}
      context={<>{plural(block.count, 'pedido', 'pedidos')} ({formatPct(pct(block.count, orders.length))}) entraron en esas tres horas. Hora de Colombia, según el momento del pago.</>}
      action={`Programa lanzamientos, correos y publicaciones para el ${WEEKDAYS_ONE[peakDay]} antes de las ${hourLabel(block.start)}, cuando tus clientes ya están listos para comprar.`}
      empty={orders.length < MIN_ORDERS_FOR_PATTERNS ? `Hacen falta al menos ${MIN_ORDERS_FOR_PATTERNS} pedidos para ver un patrón.` : undefined}
      table={<DataTable caption="Pedidos por día y hora" head={['Momento', 'Pedidos']} rows={[
        ...WEEKDAYS_LONG.map((d, i) => [d, time.byDay[i]]),
        ...time.byHour.map((c, h) => [`${hourLabel(h)} – ${h}:59`, c]),
      ]} />}
    >
      <div className="grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">Por día</p>
          <Histogram
            ariaLabel={`Pedidos por día de la semana; el pico es el ${WEEKDAYS_LONG[peakDay]}`}
            height={110}
            data={WEEKDAYS.map((d, i) => ({
              key: d, label: d, value: time.byDay[i], tone: i === peakDay ? 'hi' : 'ctx',
              capLabel: i === peakDay ? String(time.byDay[i]) : undefined,
              title: `${WEEKDAYS_LONG[i]}: ${plural(time.byDay[i], 'pedido', 'pedidos')}`,
            }))}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">Por hora</p>
          <Histogram
            ariaLabel={`Pedidos por hora; la franja más fuerte va de ${hourLabel(block.start)} a ${hourLabel((block.start + 3) % 24)}`}
            height={110}
            labelEvery={6}
            data={time.byHour.map((c, h) => ({
              key: String(h), label: String(h), value: c, tone: blockHours.has(h) ? 'hi' : 'ctx',
              title: `${hourLabel(h)}: ${plural(c, 'pedido', 'pedidos')}`,
            }))}
          />
        </div>
      </div>
    </InsightCard>
  );

  // 7. Cities
  const byTicket = [...cityRows].sort((a, b) => b.avgTicket - a.avgTicket);
  const hiCity = byTicket[0];
  const loCity = byTicket[byTicket.length - 1];
  const cityCard = (
    <InsightCard
      id="ins-ciudades"
      headline={hiCity && loCity && cityRows.length > 1
        ? `En ${hiCity.name} cada pedido deja ${formatPrice(hiCity.avgTicket)}, un ${formatPct(pct(hiCity.avgTicket - loCity.avgTicket, loCity.avgTicket))} más que en ${loCity.name}`
        : 'Aún no hay suficientes ciudades para comparar'}
      context={cityRows.length > 1 ? <>{cityRows[0].name} lidera en ventas totales ({formatPct(pct(cityRows[0].revenue, cityRows.reduce((s, c) => s + c.revenue, 0)))}). Ticket = valor de los productos del pedido, sin envío.</> : undefined}
      action={hiCity ? `Prueba anuncios segmentados en ${hiCity.name}: con el mismo costo por clic, cada venta allí deja más.` : undefined}
      empty={cityRows.length > 1 ? undefined : 'Se necesitan pedidos de al menos dos ciudades.'}
      table={<DataTable caption="Ventas por ciudad" head={['Ciudad', 'Pedidos', 'Ventas', 'Ticket']} rows={cityRows.map((c) => [c.name, c.orders, formatPrice(c.revenue), formatPrice(c.avgTicket)])} />}
    >
      <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Ticket promedio por ciudad</p>
      <BarChart
        ariaLabel={`Ticket promedio por ciudad; el más alto es ${hiCity?.name}`}
        rows={byTicket.slice(0, 8).map((c, i) => ({
          key: c.name, label: c.name, value: c.avgTicket, valueLabel: formatPrice(c.avgTicket),
          tone: i === 0 ? 'hi' : 'ctx', detail: `${plural(c.orders, 'pedido', 'pedidos')} · ${formatPrice(c.revenue)} en ventas`,
        }))}
      />
    </InsightCard>
  );

  return (
    <>
      {dormantCard}
      {coverageCard}
      {shippingCard}
      {paretoCard}
      {franchiseCard}
      {timingCard}
      {cityCard}
    </>
  );
}

// ---------- Page body ----------

export function AnalysisView() {
  const [preset, setPreset] = useState(90);
  const [range, setRange] = useState<DateRange>(() => presetRange(90));
  const [draft, setDraft] = useState<DateRange>(range);
  const [rangeError, setRangeError] = useState('');
  const data = useInsightsData(range);
  const days = rangeDays(range);

  const choosePreset = (n: number) => {
    const r = presetRange(n);
    setPreset(n);
    setDraft(r);
    setRange(r);
    setRangeError('');
  };

  const applyCustom = () => {
    if (!draft.desde || !draft.hasta) return setRangeError('Elige ambas fechas.');
    if (draft.desde > draft.hasta) return setRangeError('La fecha inicial no puede ser posterior a la final.');
    setRangeError('');
    setPreset(0);
    setRange({ ...draft });
  };

  const { prevOrders, byProduct, orders, products } = data;

  return (
    <div className={`space-y-6 ${chartTokens.varsClass}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={preset === n}
              onClick={() => choosePreset(n)}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${preset === n ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'}`}
            >
              {n} días
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
          <button type="button" onClick={applyCustom} className="min-h-11 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]">
            Aplicar
          </button>
        </div>
      </div>
      {rangeError && <p className="text-sm text-[var(--color-error)]" role="alert">{rangeError}</p>}

      <p className="text-sm text-[var(--color-text-muted)]">
        {formatDay(range.desde, true)} – {formatDay(range.hasta, true)}. Hallazgos calculados con los pedidos pagados, enviados o entregados del periodo, ordenados de lo más urgente a lo más estratégico.
      </p>

      {data.error && (
        <div role="alert" className="rounded-lg border border-[var(--color-error)] p-3 text-sm text-[var(--color-text)]">
          No se pudo cargar el análisis: {data.error instanceof Error ? data.error.message : 'error desconocido'}.{' '}
          <button type="button" onClick={data.refetch} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {orders?.capped && (
        <p className="rounded-lg bg-[var(--color-bg-alt)] p-3 text-sm text-[var(--color-text)]">
          El periodo tiene {orders.total.toLocaleString('es-CO')} pedidos; el análisis usa los {orders.orders.length.toLocaleString('es-CO')} más recientes. Elige un periodo más corto para verlo completo.
        </p>
      )}

      {!(byProduct && orders && products) ? (
        !data.error && (
          <div className="space-y-6" aria-busy="true" aria-label="Cargando análisis">
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className={`${adminCardClass} h-28 animate-pulse`} />)}
            </div>
            <InsightSkeleton />
            <InsightSkeleton />
          </div>
        )
      ) : (
        <div className={`space-y-6 transition-opacity duration-200 ${data.isFetching ? 'opacity-60' : ''}`}>
          <KpiRow orders={orders.orders} prevOrders={prevOrders?.orders} days={days} />
          {orders.orders.length === 0 ? (
            <div className={`${adminCardClass} px-6 py-12 text-center`}>
              <p className="text-base font-semibold text-[var(--color-text)]">No hay ventas en este periodo.</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Elige un periodo más largo para ver hallazgos.</p>
            </div>
          ) : (
            <Insights range={range} orders={orders.orders} products={products} byProduct={byProduct} />
          )}
        </div>
      )}
    </div>
  );
}
