'use client';

import { useState } from 'react';
import Image from 'next/image';
import { adminInputClass } from '@/components/admin/AdminShell';
import { formatDay } from '@/components/admin/charts/format';
import { Sticker } from '@/components/ui/Sticker';
import { cn, formatPrice } from '@/lib/utils';
import type { AdminProduct, DashboardInsights, DashboardSummary, DateRange } from '@/types/admin';
import { BarChart, Delta, Dumbbell, Histogram, Legend, SplitBar, chartTokens, type Tone } from './charts';
import {
  LOW_MARGIN_PCT, MIN_COUPON_ORDERS, STOCKOUT_HORIZON_DAYS, WEEKDAYS, WEEKDAYS_LONG, WEEKDAYS_ONE,
  catalogSize, cities, coupons, dormantInventory, formatPct, franchises, kpis, margins, num, pareto, peakBlock, pct,
  rangeDays, repeatCustomers, shippingThreshold, stockCoverage, timing,
} from './compute';
import { ChartMotion, DataTable, GROUNDS, Story, StorySkeleton, containerClass } from './InsightCard';
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
const MAX_RANGE_DAYS = 366;
const MIN_ORDERS_FOR_PATTERNS = 10;
// A city with one or two orders makes any average look extreme; compare only cities above this.
const MIN_CITY_ORDERS = 3;
const FEW_CITY_ORDERS = 10;
// Every product is a Funko Pop!, so charts drop the shared prefix to keep names readable.
const short = (name: string) => name.replace(/^Funko Pop!\s*/i, '');
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;
const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0] ?? '');
const times = (ratio: number) => `${(Math.round(ratio * 10) / 10).toLocaleString('es-CO')}×`;
const FRAME_INKS = ['var(--color-primary)', 'var(--color-accent)', '#6A55B8', 'var(--color-primary)'];

// ---------- KPI row ----------

function Comparison({ now, before, days }: { now: number; before: number | undefined; days: number }) {
  if (before === undefined) return null;
  if (before === 0) {
    return <p className="mt-2 text-sm text-[var(--color-text-muted)]">{now > 0 ? `Sin ventas en los ${days} días anteriores` : 'Igual que el periodo anterior'}</p>;
  }
  return <Delta change={((now - before) / before) * 100} suffix={`vs. ${days} días anteriores`} />;
}

function Figure({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-base text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1">
        <span className="block text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--color-text)]">{value}</span>
        {children}
      </dd>
    </div>
  );
}

function KpiRow({ summary, prevSummary, insights, days }: {
  summary: DashboardSummary; prevSummary?: DashboardSummary; insights: DashboardInsights; days: number;
}) {
  const now = kpis(summary);
  const prev = prevSummary ? kpis(prevSummary) : undefined;
  const repeat = repeatCustomers(insights);
  const m = margins(insights);
  const profit = num(insights.utilidad_total);
  const note = 'mt-2 text-sm text-[var(--color-text-muted)]';
  return (
    <dl className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      <Figure label="Ventas netas" value={formatPrice(now.revenue)}>
        <Comparison now={now.revenue} before={prev?.revenue} days={days} />
      </Figure>
      <Figure label="Pedidos" value={now.orders.toLocaleString('es-CO')}>
        <Comparison now={now.orders} before={prev?.orders} days={days} />
      </Figure>
      <Figure label="Ticket promedio" value={formatPrice(now.avgTicket)}>
        <Comparison now={now.avgTicket} before={prev?.avgTicket} days={days} />
      </Figure>
      <Figure label="Utilidad total" value={m.costed.length ? formatPrice(profit) : '—'}>
        <p className={note}>
          {!m.costed.length ? 'Ningún producto vendido tiene costo registrado'
            : m.missingCost.length ? `Sin contar ${plural(m.missingCost.length, 'producto sin costo', 'productos sin costo')} registrado`
              : 'Ingresos por productos menos su costo de importación'}
        </p>
      </Figure>
      <Figure label="Margen promedio" value={insights.margen_promedio_pct === null ? '—' : formatPct(insights.margen_promedio_pct)}>
        <p className={note}>{insights.margen_promedio_pct === null ? 'Sin costos para calcularlo' : 'De cada $100 vendidos en productos con costo'}</p>
      </Figure>
      <Figure label="Clientes que repiten" value={repeat.customers ? `${repeat.repeat} de ${repeat.customers}` : '—'}>
        <p className={note}>{repeat.customers ? `Dejan el ${formatPct(repeat.repeatRevenueShare)} de las ventas netas` : 'Sin compradores en el periodo'}</p>
      </Figure>
    </dl>
  );
}

// ---------- Insights ----------

function Insights({ insights, products }: { insights: DashboardInsights; products: AdminProduct[] }) {
  const days = insights.dias;
  const m = margins(insights);
  const dormant = dormantInventory(insights, products);
  const coverage = stockCoverage(insights);
  const shipping = shippingThreshold(insights, m);
  const concentration = pareto(m, catalogSize(insights));
  const franchiseRows = franchises(insights);
  const time = timing(insights);
  const cityRows = cities(insights);
  const coupon = coupons(insights);
  const productById = new Map(products.map((p) => [p.id, p]));

  // 1. Dormant inventory
  const dormantShare = pct(dormant.dormantValue, dormant.totalStockValue);
  const dormantTop = dormant.items.slice(0, 8);
  const dormantPhotos = dormant.items
    .map((d) => {
      const p = productById.get(d.id);
      const img = p?.images.find((i) => i.is_primary) ?? p?.images[0];
      return img ? { ...d, src: img.image } : null;
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .slice(0, 4);
  const dormantStory = (
    <Story
      id="ins-dormido"
      ground="stage"
      layout="wide"
      headline={dormant.dormantCount ? `${formatPrice(dormant.dormantValue)} están quietos en la bodega` : 'Todo lo que tienes en stock se movió'}
      pull={{ value: formatPct(dormantShare), caption: <>del valor de tu inventario no vendió ni una unidad en {days} días.</> }}
      stamp={dormantShare >= 25 ? { label: 'Ojo', tone: 'orange' } : undefined}
      lede={dormant.dormantCount ? (
        <>
          De tus {dormant.activeCount} productos activos, <strong className="font-semibold">{dormant.dormantCount} no tuvieron ni una venta</strong>: {plural(dormant.dormantUnits, 'unidad', 'unidades')} sin movimiento, a precio de venta.
          {dormant.dormantCost > 0 && <> Te costaron {formatPrice(dormant.dormantCost)}{dormant.missingCost ? ` (sin contar ${plural(dormant.missingCost, 'producto sin costo registrado', 'productos sin costo registrado')})` : ''}.</>}
        </>
      ) : undefined}
      action="Arma combos o un descuento por tiempo limitado con los primeros de la lista y no recompres esas referencias hasta que roten."
      empty={dormant.dormantCount ? undefined : 'No hay inventario dormido en este periodo.'}
      table={<DataTable caption="Productos sin ventas en el periodo" head={['Producto', 'Stock', 'Valor', 'Costo', 'Días sin venta']} rows={dormant.items.map((d) => [d.name, d.stock, formatPrice(d.value), d.cost === null ? 'Sin costo' : formatPrice(d.cost), d.days])} />}
    >
      <SplitBar
        part={dormant.dormantValue}
        whole={dormant.totalStockValue}
        partLabel={`Sin ventas: ${formatPrice(dormant.dormantValue)}`}
        restLabel={`Con ventas: ${formatPrice(dormant.totalStockValue - dormant.dormantValue)}`}
        ariaLabel={`El ${formatPct(dormantShare)} del valor del inventario está en productos sin ventas`}
      />
      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0">
          <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Dónde está el dinero quieto</h3>
          <BarChart
            ariaLabel="Productos sin ventas con más dinero en inventario"
            rows={dormantTop.map((d) => ({
              key: d.id, label: short(d.name), value: d.value, valueLabel: formatPrice(d.value), tone: 'hi',
              detail: `${plural(d.stock, 'unidad', 'unidades')} en stock · ${plural(d.days, 'día', 'días')} sin venderse`,
            }))}
          />
          {dormant.items.length > dormantTop.length && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              y {plural(dormant.items.length - dormantTop.length, 'producto más', 'productos más')} por {formatPrice(dormant.items.slice(dormantTop.length).reduce((s, d) => s + d.value, 0))}
            </p>
          )}
        </div>
        {dormantPhotos.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 self-start" aria-label="Algunos de los productos sin ventas">
            {dormantPhotos.map((d, i) => (
              <li key={d.id} className="min-w-0">
                <div className="photo-frame" style={{ '--frame-ink': FRAME_INKS[i] } as React.CSSProperties}>
                  <div className="riso-photo relative aspect-[4/5] overflow-hidden rounded-[6px] bg-[var(--color-stage-raised)]">
                    <Image src={d.src} alt="" fill sizes="200px" className="object-cover" unoptimized />
                  </div>
                </div>
                <p className="mt-4 truncate text-sm font-semibold text-[var(--color-text)]" title={d.name}>{short(d.name)}</p>
                <p className="text-sm tabular-nums text-[var(--color-text-muted)]">{plural(d.stock, 'unidad quieta', 'unidades quietas')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Story>
  );

  // 2. Stock-out risk
  const firstRisk = coverage.items[0];
  const daysLabel = (d: number, stock: number) => (stock <= 0 ? 'Agotado' : `~${Math.round(d)} días`);
  const coverageStory = (
    <Story
      id="ins-agotarse"
      ground="paper"
      layout="split"
      headline={!firstRisk ? 'Aún no hay ventas para medir la cobertura'
        : coverage.atRisk.length
          ? `${short(firstRisk.name)} ${firstRisk.stock <= 0 ? 'ya se agotó' : `se agota en ~${Math.round(firstRisk.days)} días`}`
          : `Nada de lo que vendes se agota antes de ${STOCKOUT_HORIZON_DAYS} días`}
      pull={firstRisk ? {
        value: firstRisk.stock <= 0 ? '0' : String(Math.round(firstRisk.days)),
        caption: <>días de stock le quedan a {short(firstRisk.name)}, al ritmo de venta del periodo.</>,
      } : undefined}
      stamp={coverage.atRisk.length ? { label: 'Ojo', tone: 'orange' } : undefined}
      lede={firstRisk ? (
        <>
          {coverage.atRisk.length > 1 && <><strong className="font-semibold">{plural(coverage.atRisk.length - 1, 'producto más baja', 'productos más bajan')} de {STOCKOUT_HORIZON_DAYS} días.</strong> </>}
          Cobertura = stock actual ÷ ritmo de venta de los {coverage.windowDays} días del periodo; del más urgente al más holgado.
        </>
      ) : undefined}
      action={coverage.atRisk.length
        ? `Pide ya la reposición de ${list(coverage.atRisk.slice(0, 3).map((i) => short(i.name)))}: si la importación tarda más que su cobertura, te quedas sin lo que se vende.`
        : `Revisa esta lista cada semana y repón cuando un producto baje de ${STOCKOUT_HORIZON_DAYS} días de cobertura.`}
      empty={firstRisk ? undefined : `No hubo ventas en los ${coverage.windowDays} días del periodo.`}
      table={<DataTable caption="Cobertura de stock" head={['Producto', 'Stock', 'Vendidas por día', 'Cobertura']} rows={coverage.items.map((i) => [i.name, i.stock, i.perDay.toLocaleString('es-CO'), daysLabel(i.days, i.stock)])} />}
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
          detail: `${plural(i.stock, 'unidad', 'unidades')} en stock · ${i.perDay.toLocaleString('es-CO')} vendidas por día`,
        }))}
      />
    </Story>
  );

  // 3. Margin per product
  const { bestSeller, topProfit, topMargin } = m;
  const counterintuitive = Boolean(topProfit && bestSeller && topProfit.id !== bestSeller.id && topProfit.units < bestSeller.units);
  const unitRatio = counterintuitive && bestSeller?.unitProfit && bestSeller.unitProfit > 0 && topProfit
    ? topProfit.unitProfit / bestSeller.unitProfit : null;
  const marginHeadline = !topProfit || !bestSeller
    ? 'Sin costos registrados no se puede medir cuánto deja cada producto'
    : counterintuitive
      ? `${short(topProfit.name)} deja más utilidad que ${short(bestSeller.name)} aunque vende menos`
      : topProfit.id === bestSeller.id
        ? `${short(bestSeller.name)} es el que más vende y también el que más deja`
        : `${short(topProfit.name)} es el producto que más utilidad deja`;
  const lowNames = m.low.slice(0, 2).map((r) => short(r.name));
  const profitRows = m.costed.slice(0, 10);
  const lowRows = [...m.costed].sort((a, b) => a.marginPct - b.marginPct).slice(0, 5);
  const marginScale = Math.max(LOW_MARGIN_PCT * 2, ...lowRows.map((r) => r.marginPct));
  const marginStory = (
    <Story
      id="ins-margen"
      ground="field"
      layout="reverse"
      headline={marginHeadline}
      pull={topProfit ? (unitRatio && unitRatio >= 1.1
        ? { value: times(unitRatio), caption: <>más utilidad por unidad deja {short(topProfit.name)} que tu más vendido.</> }
        : { value: formatPct(topProfit.marginPct), caption: <>de cada venta de {short(topProfit.name)} es utilidad.</> }) : undefined}
      stamp={counterintuitive ? { label: '¿Quién lo diría?', tone: 'purple' } : m.losses.length ? { label: 'Ojo', tone: 'orange' } : undefined}
      lede={topProfit && bestSeller ? (
        <>
          {counterintuitive && bestSeller.unitProfit !== null && (
            <>{formatPrice(topProfit.profit)} con {plural(topProfit.units, 'unidad', 'unidades')} frente a {formatPrice(bestSeller.profit ?? 0)} con {bestSeller.units}: cada unidad deja {formatPrice(topProfit.unitProfit)} contra {formatPrice(bestSeller.unitProfit)}. </>
          )}
          {!counterintuitive && <>Deja {formatPrice(topProfit.profit)} en el periodo. </>}
          {m.losses.length
            ? <><strong className="font-semibold">{plural(m.losses.length, 'producto se vendió', 'productos se vendieron')} a pérdida.</strong> </>
            : m.low.length
              ? <>{plural(m.low.length, 'producto deja', 'productos dejan')} menos del {LOW_MARGIN_PCT} % de margen; el más bajo es {short(m.low[0].name)} ({formatPct(m.low[0].marginPct)}). </>
              : <>Todos los productos vendidos dejan al menos el {LOW_MARGIN_PCT} % de margen. </>}
          {m.missingCost.length > 0 && <>{plural(m.missingCost.length, 'producto vendido no tiene', 'productos vendidos no tienen')} costo registrado y no entra{m.missingCost.length === 1 ? '' : 'n'} en el cálculo.</>}
        </>
      ) : undefined}
      action={!topMargin ? undefined
        : m.losses.length
          ? `Revisa ya el precio de ${list(m.losses.slice(0, 2).map((r) => short(r.name)))}: cada venta te cuesta plata.`
          : m.low.length
            ? `Sube el precio de ${list(lowNames)} o deja de pautarlos, y pon ese presupuesto en ${short(topMargin.name)}, que deja el ${formatPct(topMargin.marginPct)} de cada venta.`
            : `Pon tu pauta en ${short(topMargin.name)}: deja el ${formatPct(topMargin.marginPct)} de cada venta, el margen más alto del periodo.`}
      empty={m.costed.length ? undefined : m.rows.length
        ? `${plural(m.rows.length, 'producto vendido no tiene', 'productos vendidos no tienen')} costo registrado. Regístralo en los lotes de importación para ver la utilidad.`
        : 'Sin ventas en el periodo.'}
      table={<DataTable caption="Utilidad y margen por producto" head={['Producto', 'Unidades', 'Ingresos', 'Utilidad', 'Margen']} rows={m.rows.map((r) => [
        r.name, r.units, formatPrice(r.revenue), r.profit === null ? 'Sin costo' : formatPrice(r.profit), r.marginPct === null ? '—' : formatPct(r.marginPct),
      ])} />}
    >
      <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Utilidad por producto</h3>
      <Legend items={[
        { tone: 'hi', label: 'Más utilidad' },
        ...(bestSeller && topProfit && bestSeller.id !== topProfit.id ? [{ tone: 'second' as Tone, label: 'Más vendido' }] : []),
        { tone: 'ctx', label: 'Resto' },
      ]} />
      <BarChart
        ariaLabel={`Utilidad por producto; ${topProfit ? short(topProfit.name) : ''} deja la mayor`}
        rows={profitRows.map((r) => ({
          key: r.id, label: short(r.name), value: Math.max(0, r.profit), valueLabel: formatPrice(r.profit),
          tone: (r.id === topProfit?.id ? 'hi' : r.id === bestSeller?.id ? 'second' : 'ctx') as Tone,
          detail: `${plural(r.units, 'unidad', 'unidades')} · margen ${formatPct(r.marginPct)}`,
        }))}
      />
      {bestSeller && !profitRows.some((r) => r.id === bestSeller.id) && (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          El más vendido, {short(bestSeller.name)} ({plural(bestSeller.units, 'unidad', 'unidades')}), no está entre los 10 que más utilidad dejan.
        </p>
      )}
      <h3 className="mb-4 mt-12 text-lg font-semibold text-[var(--color-text)]">Margen más bajo</h3>
      <BarChart
        ariaLabel={`Los ${lowRows.length} productos con menor margen`}
        max={marginScale}
        marker={{ value: LOW_MARGIN_PCT, label: `${LOW_MARGIN_PCT} %` }}
        rows={lowRows.map((r) => ({
          key: r.id, label: short(r.name), value: Math.max(0, r.marginPct), valueLabel: formatPct(r.marginPct),
          tone: (r.marginPct < LOW_MARGIN_PCT ? 'hi' : 'ctx') as Tone,
          detail: `${formatPrice(r.profit)} de utilidad con ${plural(r.units, 'unidad', 'unidades')}`,
        }))}
      />
    </Story>
  );

  // 4. Free-shipping threshold
  const threshold = shipping.threshold ?? 0;
  const gap = threshold - shipping.nearFrom;
  const thresholdIndex = shipping.bins.findIndex((b) => b.from >= threshold);
  const shippingStory = (
    <Story
      id="ins-envio"
      ground="paper"
      layout="wide"
      headline={shipping.threshold === null ? 'No hay un envío gratis configurado'
        : shipping.near
          ? `${plural(shipping.near, 'pedido se quedó', 'pedidos se quedaron')} a un Funko del envío gratis`
          : `Ningún pedido quedó a menos de ${formatPrice(gap)} del envío gratis`}
      pull={shipping.threshold === null ? undefined : {
        value: formatPct(pct(shipping.near, shipping.orders)),
        caption: <>de los pedidos quedó a menos de {formatPrice(gap)} del envío gratis.</>,
      }}
      lede={shipping.threshold === null ? undefined : (
        <>El envío es gratis desde {formatPrice(threshold)} y un Funko típico cuesta {formatPrice(shipping.typicalPrice)}: a esos clientes les faltaba un solo producto. Ya califica el {formatPct(pct(shipping.qualifying, shipping.orders))} de los pedidos.</>
      )}
      action={`Muestra en el carrito cuánto falta para el envío gratis y sugiere un Funko de unos ${formatPrice(shipping.typicalPrice)}: cada cliente que lo agregue es una venta más.`}
      empty={shipping.threshold === null ? 'Configura un umbral de envío gratis en las zonas de envío para medir este hallazgo.'
        : shipping.orders < MIN_ORDERS_FOR_PATTERNS ? `Hacen falta al menos ${MIN_ORDERS_FOR_PATTERNS} pedidos para ver cómo se reparten.` : undefined}
      table={<DataTable caption="Pedidos por valor de productos" head={['Valor de productos', 'Pedidos']} rows={shipping.bins.map((b) => [`${formatPrice(b.from)} – ${formatPrice(b.to - 1)}`, b.count])} />}
    >
      <Legend items={[
        { tone: 'hi', label: `A ${formatPrice(gap)} o menos` },
        { tone: 'second', label: 'Con envío gratis' },
        { tone: 'ctx', label: 'Resto' },
      ]} />
      <Histogram
        ariaLabel={`Pedidos por valor de productos en tramos de $50.000; ${shipping.near} justo debajo del envío gratis`}
        height={220}
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
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">Valor de los productos del pedido, sin envío.</p>
    </Story>
  );

  // 5. Coupons
  const couponComparable = coupon.withOrders > 0 && coupon.withoutOrders > 0;
  const couponFlat = Math.round(Math.abs(coupon.ticketChange)) === 0;
  const ticketTop = Math.max(coupon.withTicket, coupon.withoutTicket, 1);
  const couponStory = (
    <Story
      id="ins-cupones"
      ground="stage"
      layout="pair"
      headline={!couponComparable
        ? coupon.withOrders === 0 ? 'Ningún pedido usó cupón en el periodo' : 'Todos los pedidos del periodo usaron cupón'
        : couponFlat ? 'Con cupón o sin él, cada pedido deja lo mismo'
          : coupon.ticketChange < 0 ? 'Los cupones no suben el ticket: lo bajan' : 'Los pedidos con cupón dejan más'}
      stamp={coupon.fewData ? { label: 'Pocos datos', tone: 'cream' } : coupon.ticketChange < 0 && !couponFlat ? { label: '¿Quién lo diría?', tone: 'orange' } : undefined}
      lede={couponComparable ? (
        <>
          {plural(coupon.withOrders, 'pedido usó', 'pedidos usaron')} cupón ({formatPct(coupon.share)}). Con cupón se llevan {coupon.withUnits.toLocaleString('es-CO')} productos por pedido; sin cupón, {coupon.withoutUnits.toLocaleString('es-CO')}. Ticket neto = productos menos descuento, sin envío.
          {coupon.fewData && <> Con menos de {MIN_COUPON_ORDERS} pedidos con cupón, tómalo como una señal, no como una conclusión.</>}
        </>
      ) : undefined}
      action={coupon.ticketChange < 0
        ? 'Ponle al cupón un monto mínimo de compra (por ejemplo, cerca del envío gratis) para que el descuento obligue a llevar un producto más.'
        : 'El cupón acompaña compras más grandes: úsalo en campañas para clientes que ya compraron y mide si repiten.'}
      empty={coupon.withOrders === 0 ? 'Sin pedidos con cupón no hay con qué comparar.'
        : coupon.withoutOrders === 0 ? 'Sin pedidos sin cupón no hay con qué comparar.' : undefined}
      table={<DataTable caption="Pedidos con y sin cupón" head={['', 'Pedidos', 'Ticket neto', 'Productos por pedido']} rows={[
        ['Con cupón', coupon.withOrders, formatPrice(coupon.withTicket), coupon.withUnits.toLocaleString('es-CO')],
        ['Sin cupón', coupon.withoutOrders, formatPrice(coupon.withoutTicket), coupon.withoutUnits.toLocaleString('es-CO')],
      ]} />}
    >
      <div role="img" aria-label={`Ticket neto promedio: ${formatPrice(coupon.withoutTicket)} sin cupón y ${formatPrice(coupon.withTicket)} con cupón`} className="grid max-w-5xl gap-12 md:grid-cols-2">
        {[
          { key: 'sin', value: coupon.withoutTicket, label: `Ticket neto sin cupón · ${plural(coupon.withoutOrders, 'pedido', 'pedidos')}`, hi: false },
          { key: 'con', value: coupon.withTicket, label: `Ticket neto con cupón · ${plural(coupon.withOrders, 'pedido', 'pedidos')}`, hi: true },
        ].map((c, i) => (
          <div key={c.key} className="min-w-0">
            <p className={cn('font-[family-name:var(--font-display)] text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.9] tabular-nums', c.hi ? 'misreg text-[var(--ins-hi)]' : 'text-[var(--color-text)]')}>
              {formatPrice(c.value)}
            </p>
            <span
              aria-hidden
              className="ins-grow-x mt-5 block h-3.5 rounded-r"
              style={{ width: `${(c.value / ticketTop) * 100}%`, background: c.hi ? 'var(--ins-hi)' : 'var(--ins-2)', animationDelay: `${i * 120}ms` }}
            />
            <p className="mt-3 text-base text-[var(--color-text)]">{c.label}</p>
          </div>
        ))}
      </div>
      {!couponFlat && (
        <p className="mt-10 text-2xl font-semibold tabular-nums text-[var(--color-primary-text)]">
          {coupon.ticketChange > 0 ? '+' : '−'}{formatPct(Math.abs(coupon.ticketChange))} por pedido con cupón
        </p>
      )}
    </Story>
  );

  // 6. Concentration
  const paretoLimit = Math.min(Math.max(15, concentration.coreCount + 3), 30);
  const paretoRows = concentration.items.slice(0, paretoLimit);
  const restCount = concentration.items.length - paretoRows.length;
  const restRevenue = concentration.items.slice(paretoLimit).reduce((s, i) => s + i.revenue, 0);
  const paretoStory = (
    <Story
      id="ins-pareto"
      ground="paper"
      layout="split"
      headline={concentration.coreCount ? `Tu negocio cabe en ${plural(concentration.coreCount, 'producto', 'productos')}` : 'Todavía no hay ingresos para medir la concentración'}
      pull={concentration.coreCount ? {
        value: formatPct(pct(concentration.coreCount, concentration.catalogCount)),
        caption: <>de tu catálogo genera el {formatPct(concentration.coreShare)} de los ingresos.</>,
      } : undefined}
      lede={concentration.coreCount ? (
        <>Son {concentration.coreCount} de {concentration.catalogCount} productos. Solo {plural(concentration.soldCount, 'producto vendió', 'productos vendieron')} algo en {days} días; el resto del catálogo no aportó ingresos.</>
      ) : undefined}
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
            tone: (i.core ? 'hi' : 'ctx') as Tone, detail: `Acumulado: ${formatPct(i.cumulative)} de los ingresos`,
          })),
          ...(restCount > 0 ? [{ key: 'rest', label: `Otros ${restCount} productos`, value: restRevenue, valueLabel: formatPrice(restRevenue), tone: 'ctx' as const }] : []),
        ]}
      />
    </Story>
  );

  // 7. Franchises
  const ranked = franchiseRows.filter((f) => f.products > 0 || f.revenue > 0);
  const byGap = [...ranked].sort((a, b) => b.gap - a.gap);
  const best = byGap[0];
  const worst = byGap[byGap.length - 1];
  const shown = [...byGap.slice(0, 4), ...byGap.slice(-4)].filter((f, i, arr) => arr.findIndex((x) => x.name === f.name) === i);
  const overs = byGap.filter((f) => f.gap > 0).slice(0, 2).map((f) => f.name);
  const fr = best && worst && best.gap > 0 ? { best, worst } : null;
  const franchiseStory = (
    <Story
      id="ins-franquicias"
      ground="field"
      layout="reverse"
      headline={fr ? `${fr.best.name} vende más de lo que ocupa; ${fr.worst.name}, mucho menos` : 'Aún no hay ventas para comparar franquicias'}
      pull={fr ? (fr.best.catalogShare > 0
        ? { value: times(fr.best.revenueShare / fr.best.catalogShare), caption: <>más peso tiene {fr.best.name} en tus ventas que en tu catálogo.</> }
        : { value: formatPct(fr.best.revenueShare), caption: <>de los ingresos viene de {fr.best.name}.</> }) : undefined}
      lede={fr ? (
        <>{fr.best.name} es el {formatPct(fr.best.catalogShare)} del catálogo y trae el {formatPct(fr.best.revenueShare)} de los ingresos; {fr.worst.name} ocupa el {formatPct(fr.worst.catalogShare)} y vende el {formatPct(fr.worst.revenueShare)}. Se muestran las franquicias que más se desvían.</>
      ) : undefined}
      action={overs.length && worst ? `Amplía el surtido de ${list(overs)}; con ${worst.name}, no repongas hasta liquidar lo que tienes.` : undefined}
      empty={fr ? undefined : 'Sin ventas en el periodo.'}
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
    </Story>
  );

  // 8. When they buy
  const peakDay = time.byDay.indexOf(Math.max(...time.byDay));
  const block = peakBlock(time.byHour);
  const blockHours = new Set([block.start, (block.start + 1) % 24, (block.start + 2) % 24]);
  const hourLabel = (h: number) => `${h}:00`;
  const timingStory = (
    <Story
      id="ins-cuando"
      ground="paper"
      layout="wide"
      headline={`Los ${WEEKDAYS_LONG[peakDay]} compran más; la franja fuerte va de ${hourLabel(block.start)} a ${hourLabel((block.start + 3) % 24)}`}
      pull={{ value: formatPct(pct(time.byDay[peakDay], time.orders)), caption: <>de los pedidos entra los {WEEKDAYS_LONG[peakDay]}.</> }}
      lede={<>{plural(block.count, 'pedido', 'pedidos')} ({formatPct(pct(block.count, time.orders))}) entraron en esas tres horas. Hora de Colombia, según el momento del pago.</>}
      action={`Programa lanzamientos, correos y publicaciones para el ${WEEKDAYS_ONE[peakDay]} antes de las ${hourLabel(block.start)}, cuando tus clientes ya están listos para comprar.`}
      empty={time.orders < MIN_ORDERS_FOR_PATTERNS ? `Hacen falta al menos ${MIN_ORDERS_FOR_PATTERNS} pedidos para ver un patrón.` : undefined}
      table={<DataTable caption="Pedidos por día y hora" head={['Momento', 'Pedidos']} rows={[
        ...WEEKDAYS_LONG.map((d, i) => [d, time.byDay[i]]),
        ...time.byHour.map((c, h) => [`${hourLabel(h)} – ${h}:59`, c]),
      ]} />}
    >
      <div className="grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Por día</h3>
          <Histogram
            ariaLabel={`Pedidos por día de la semana; el pico es el ${WEEKDAYS_ONE[peakDay]}`}
            height={180}
            data={WEEKDAYS.map((d, i) => ({
              key: d, label: d, value: time.byDay[i], tone: i === peakDay ? 'hi' : 'ctx',
              capLabel: i === peakDay ? String(time.byDay[i]) : undefined,
              title: `${WEEKDAYS_LONG[i]}: ${plural(time.byDay[i], 'pedido', 'pedidos')}`,
            }))}
          />
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Por hora</h3>
          <Histogram
            ariaLabel={`Pedidos por hora; la franja más fuerte va de ${hourLabel(block.start)} a ${hourLabel((block.start + 3) % 24)}`}
            height={180}
            labelEvery={6}
            data={time.byHour.map((c, h) => ({
              key: String(h), label: String(h), value: c, tone: blockHours.has(h) ? 'hi' : 'ctx',
              title: `${hourLabel(h)}: ${plural(c, 'pedido', 'pedidos')}`,
            }))}
          />
        </div>
      </div>
    </Story>
  );

  // 9. Cities: averages from one or two orders are noise, so only cities above the floor compete.
  const comparable = cityRows.filter((c) => c.orders >= MIN_CITY_ORDERS);
  const byTicket = [...comparable].sort((a, b) => b.avgTicket - a.avgTicket);
  const hiCity = byTicket[0];
  const loCity = byTicket[byTicket.length - 1];
  const cmp = byTicket.length > 1 && hiCity && loCity && loCity.avgTicket > 0 ? { hi: hiCity, lo: loCity } : null;
  const cityStory = (
    <Story
      id="ins-ciudades"
      ground="field"
      layout="split"
      headline={cmp ? `En ${cmp.hi.name} cada pedido deja más` : 'Aún no hay suficientes ciudades para comparar'}
      pull={cmp ? {
        value: `+${formatPct(pct(cmp.hi.avgTicket - cmp.lo.avgTicket, cmp.lo.avgTicket))}`,
        caption: <>deja un pedido en {cmp.hi.name} frente a uno en {cmp.lo.name}.</>,
      } : undefined}
      stamp={cmp && Math.min(cmp.hi.orders, cmp.lo.orders) < FEW_CITY_ORDERS ? { label: 'Pocos datos', tone: 'cream' } : undefined}
      lede={cmp ? (
        <>
          {formatPrice(cmp.hi.avgTicket)} por pedido en {cmp.hi.name} ({plural(cmp.hi.orders, 'pedido', 'pedidos')}) contra {formatPrice(cmp.lo.avgTicket)} en {cmp.lo.name} ({plural(cmp.lo.orders, 'pedido', 'pedidos')}). Solo se comparan ciudades con {MIN_CITY_ORDERS} pedidos o más. {cityRows[0].name} lidera en ventas totales ({formatPct(pct(cityRows[0].revenue, cityRows.reduce((s, c) => s + c.revenue, 0)))}).
        </>
      ) : undefined}
      action={cmp ? `Prueba anuncios segmentados en ${cmp.hi.name}: con el mismo costo por clic, cada venta allí deja más.` : undefined}
      empty={cmp ? undefined : `Se necesitan al menos dos ciudades con ${MIN_CITY_ORDERS} pedidos o más.`}
      table={<DataTable caption="Ventas por ciudad" head={['Ciudad', 'Pedidos', 'Ventas netas', 'Ticket']} rows={cityRows.map((c) => [c.name, c.orders, formatPrice(c.revenue), formatPrice(c.avgTicket)])} />}
    >
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Ticket promedio por ciudad</h3>
      <BarChart
        ariaLabel={`Ticket promedio por ciudad; el más alto es ${hiCity?.name}`}
        rows={byTicket.slice(0, 8).map((c, i) => ({
          key: c.name, label: c.name, value: c.avgTicket, valueLabel: formatPrice(c.avgTicket),
          tone: i === 0 ? 'hi' : 'ctx', detail: `${plural(c.orders, 'pedido', 'pedidos')} · ${formatPrice(c.revenue)} en ventas`,
        }))}
      />
    </Story>
  );

  return (
    <>
      {dormantStory}
      {coverageStory}
      {marginStory}
      {shippingStory}
      {couponStory}
      {paretoStory}
      {franchiseStory}
      {timingStory}
      {cityStory}
    </>
  );
}

// ---------- Page body ----------

const pillClass = 'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors';

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
    if (rangeDays(draft) > MAX_RANGE_DAYS) return setRangeError(`El periodo puede tener máximo ${MAX_RANGE_DAYS} días.`);
    setRangeError('');
    setPreset(0);
    setRange({ ...draft });
  };

  const { insights, summary, prevSummary, products } = data;
  const ready = Boolean(insights && summary && products);
  const activeCount = products?.filter((p) => p.is_active).length ?? 0;

  return (
    <div className={chartTokens.varsClass}>
      <ChartMotion />
      <header className={cn('pb-20 pt-12 md:pb-28 md:pt-16', GROUNDS.paper)}>
        <div className={containerClass}>
          <h1 className="type-hero misreg max-w-[14ch] text-[var(--color-text)]">Lo que tus ventas no te están diciendo</h1>
          <p className="mt-8 max-w-[52ch] text-xl leading-relaxed text-[var(--color-text)] md:text-2xl">
            {ready && summary
              ? summary.pedidos > 0
                ? <>Revisamos {plural(summary.pedidos, 'pedido', 'pedidos')} y {plural(activeCount, 'producto activo', 'productos activos')}. Nueve hallazgos, de lo más urgente a lo más estratégico, cada uno con lo que conviene hacer.</>
                : <>Revisamos {plural(activeCount, 'producto activo', 'productos activos')}, pero en este periodo no entró ningún pedido pagado.</>
              : 'Revisando pedidos, productos y costos del periodo…'}
          </p>
          <p className="mt-4 text-base text-[var(--color-text-muted)]">
            Del {formatDay(range.desde, true)} al {formatDay(range.hasta, true)} · se recalcula con cada pedido
          </p>

          <div className="mt-10 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={preset === n}
                  onClick={() => choosePreset(n)}
                  className={cn(pillClass, preset === n
                    ? 'bg-[var(--color-secondary)] text-white dark:bg-[var(--color-primary)] dark:text-[var(--color-on-primary)]'
                    : 'bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:bg-[#E6E1F4] dark:hover:bg-[#1D1245]')}
                >
                  {n} días
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
              <button type="button" onClick={applyCustom} className={cn(pillClass, 'bg-[var(--color-bg-alt)] px-5 text-[var(--color-text)] hover:bg-[#E6E1F4] dark:hover:bg-[#1D1245]')}>
                Aplicar
              </button>
            </div>
          </div>
          {rangeError && <p className="mt-3 text-sm text-[var(--color-error)]" role="alert">{rangeError}</p>}

          {data.error && (
            <p role="alert" className="mt-10 max-w-[60ch] text-lg text-[var(--color-text)]">
              <strong className="font-semibold text-[var(--color-error)]">No se pudo cargar el análisis:</strong> {data.error instanceof Error ? data.error.message : 'error desconocido'}.{' '}
              <button type="button" onClick={data.refetch} className="min-h-11 font-semibold text-[var(--color-primary-text)] underline underline-offset-4">Reintentar</button>
            </p>
          )}

          <div className="mt-16 md:mt-20">
            {ready && insights && summary ? (
              <div className={cn('transition-opacity duration-200', data.isFetching && 'opacity-60')}>
                <KpiRow summary={summary} prevSummary={prevSummary} insights={insights} days={days} />
              </div>
            ) : !data.error && (
              <div aria-busy="true" aria-label="Cargando análisis" className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                    <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {!ready ? (
        !data.error && (
          <>
            <StorySkeleton ground="stage" />
            <StorySkeleton ground="paper" />
          </>
        )
      ) : summary && summary.pedidos === 0 ? (
        <section className={cn('py-24 md:py-32', GROUNDS.field)} aria-labelledby="ins-vacio">
          <div className={cn(containerClass, 'flex flex-wrap items-center gap-x-12 gap-y-8')}>
            <div className="min-w-0 max-w-3xl">
              <h2 id="ins-vacio" className="type-page text-[var(--color-text)]">No hay ventas en este periodo</h2>
              <p className="mt-5 text-lg text-[var(--color-text)]">Elige un periodo más largo para ver los hallazgos.</p>
            </div>
            <Sticker tone="purple" tilt={-8} className="text-[26px]">Pura calma</Sticker>
          </div>
        </section>
      ) : insights && products ? (
        <div className={cn('transition-opacity duration-200', data.isFetching && 'opacity-60')}>
          <Insights insights={insights} products={products} />
        </div>
      ) : null}
    </div>
  );
}
