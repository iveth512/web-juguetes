'use client';

import { useState } from 'react';
import { adminCardClass, adminInputClass } from '@/components/admin/AdminShell';
import { formatDay } from '@/components/admin/charts/format';
import { formatPrice } from '@/lib/utils';
import type { AdminProduct, DashboardInsights, DashboardSummary, DateRange } from '@/types/admin';
import { BarChart, Delta, Dumbbell, Histogram, Legend, SplitBar, StatTile, chartTokens, type Tone } from './charts';
import {
  LOW_MARGIN_PCT, MIN_COUPON_ORDERS, STOCKOUT_HORIZON_DAYS, WEEKDAYS, WEEKDAYS_LONG, WEEKDAYS_ONE,
  catalogSize, cities, coupons, dormantInventory, formatPct, franchises, kpis, margins, num, pareto, peakBlock, pct,
  rangeDays, repeatCustomers, shippingThreshold, stockCoverage, timing,
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
const MAX_RANGE_DAYS = 366;
const MIN_ORDERS_FOR_PATTERNS = 10;
// Every product is a Funko Pop!, so charts drop the shared prefix to keep names readable.
const short = (name: string) => name.replace(/^Funko Pop!\s*/i, '');
const plural = (n: number, one: string, many: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;
const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0] ?? '');

// ---------- KPI tiles ----------

function Comparison({ now, before, days }: { now: number; before: number | undefined; days: number }) {
  if (before === undefined) return <p className="mt-2 h-4" />;
  if (before === 0) {
    return <p className="mt-2 text-xs text-[var(--color-text-muted)]">{now > 0 ? `Sin ventas en los ${days} días anteriores` : 'Igual que el periodo anterior'}</p>;
  }
  return <Delta change={((now - before) / before) * 100} suffix={`vs. ${days} días anteriores`} />;
}

function KpiRow({ summary, prevSummary, insights, days }: {
  summary: DashboardSummary; prevSummary?: DashboardSummary; insights: DashboardInsights; days: number;
}) {
  const now = kpis(summary);
  const prev = prevSummary ? kpis(prevSummary) : undefined;
  const repeat = repeatCustomers(insights);
  const m = margins(insights);
  const profit = num(insights.utilidad_total);
  const costNote = m.missingCost.length
    ? `Sin contar ${plural(m.missingCost.length, 'producto sin costo', 'productos sin costo')} registrado`
    : 'Ingresos por productos menos su costo de importación';
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      <StatTile label="Ventas netas" value={formatPrice(now.revenue)}>
        <Comparison now={now.revenue} before={prev?.revenue} days={days} />
      </StatTile>
      <StatTile label="Pedidos" value={now.orders.toLocaleString('es-CO')}>
        <Comparison now={now.orders} before={prev?.orders} days={days} />
      </StatTile>
      <StatTile label="Ticket promedio" value={formatPrice(now.avgTicket)}>
        <Comparison now={now.avgTicket} before={prev?.avgTicket} days={days} />
      </StatTile>
      <StatTile label="Utilidad total" value={m.costed.length ? formatPrice(profit) : '—'}>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{m.costed.length ? costNote : 'Ningún producto vendido tiene costo registrado'}</p>
      </StatTile>
      <StatTile label="Margen promedio" value={insights.margen_promedio_pct === null ? '—' : formatPct(insights.margen_promedio_pct)}>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {insights.margen_promedio_pct === null ? 'Sin costos para calcularlo' : 'De cada $100 vendidos en productos con costo'}
        </p>
      </StatTile>
      <StatTile label="Clientes que repiten" value={repeat.customers ? `${repeat.repeat} de ${repeat.customers}` : '—'}>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {repeat.customers ? `Dejan el ${formatPct(repeat.repeatRevenueShare)} de las ventas netas` : 'Sin compradores en el periodo'}
        </p>
      </StatTile>
    </div>
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
        <>
          Son {plural(dormant.dormantUnits, 'unidad', 'unidades')} sin movimiento en {days} días: el {formatPct(dormantShare)} del valor de tu inventario, a precio de venta.
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
      <p className="mb-3 mt-6 text-sm font-semibold text-[var(--color-text)]">Dónde está el dinero quieto</p>
      <BarChart
        ariaLabel="Productos sin ventas con más dinero en inventario"
        rows={dormantTop.map((d) => ({
          key: d.id, label: short(d.name), value: d.value, valueLabel: formatPrice(d.value), tone: 'hi',
          detail: `${plural(d.stock, 'unidad', 'unidades')} en stock · ${plural(d.days, 'día', 'días')} sin venderse`,
        }))}
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
      headline={!firstRisk ? 'Aún no hay ventas para medir la cobertura'
        : coverage.atRisk.length
          ? `${short(firstRisk.name)} ${firstRisk.stock <= 0 ? 'ya está agotado' : `se agota en ~${Math.round(firstRisk.days)} días`}${coverage.atRisk.length > 1 ? ` y ${plural(coverage.atRisk.length - 1, 'producto más baja', 'productos más bajan')} de ${STOCKOUT_HORIZON_DAYS} días` : ''}`
          : `Ningún producto vendido se agota antes de ${STOCKOUT_HORIZON_DAYS} días; el más justo es ${short(firstRisk.name)} (~${Math.round(firstRisk.days)} días)`}
      context={<>Cobertura = stock actual ÷ ritmo de venta de los {coverage.windowDays} días del periodo. Del más urgente al más holgado.</>}
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
    </InsightCard>
  );

  // 3. Margin per product
  const { bestSeller, topProfit, topMargin } = m;
  const counterintuitive = Boolean(topProfit && bestSeller && topProfit.id !== bestSeller.id && topProfit.units < bestSeller.units);
  const marginHeadline = !topProfit || !bestSeller
    ? 'Sin costos registrados no se puede medir cuánto deja cada producto'
    : counterintuitive
      ? `${short(topProfit.name)} deja más utilidad que ${short(bestSeller.name)} aunque vende menos`
      : topProfit.id === bestSeller.id
        ? `${short(bestSeller.name)} es tu más vendido y también el que más utilidad deja: ${formatPrice(topProfit.profit)}`
        : `${short(topProfit.name)} es el producto que más utilidad deja: ${formatPrice(topProfit.profit)}`;
  const lowNames = m.low.slice(0, 2).map((r) => short(r.name));
  const profitRows = m.costed.slice(0, 10);
  const lowRows = [...m.costed].sort((a, b) => a.marginPct - b.marginPct).slice(0, 5);
  const marginScale = Math.max(LOW_MARGIN_PCT * 2, ...lowRows.map((r) => r.marginPct));
  const marginCard = (
    <InsightCard
      id="ins-margen"
      headline={marginHeadline}
      context={topProfit && bestSeller ? (
        <>
          {counterintuitive && bestSeller.unitProfit !== null && (
            <>{formatPrice(topProfit.profit)} con {plural(topProfit.units, 'unidad', 'unidades')} frente a {formatPrice(bestSeller.profit ?? 0)} con {bestSeller.units}: cada unidad deja {formatPrice(topProfit.unitProfit)} contra {formatPrice(bestSeller.unitProfit)}. </>
          )}
          {m.losses.length
            ? <>{plural(m.losses.length, 'producto se vendió', 'productos se vendieron')} a pérdida. </>
            : m.low.length
              ? <>{plural(m.low.length, 'producto deja', 'productos dejan')} menos del {LOW_MARGIN_PCT} % de margen; el más bajo es {short(m.low[0].name)} ({formatPct(m.low[0].marginPct)}). </>
              : <>Todos los productos vendidos dejan al menos el {LOW_MARGIN_PCT} % de margen. </>}
          Utilidad = ingresos por producto menos su costo de importación.
          {m.missingCost.length > 0 && <> {plural(m.missingCost.length, 'producto vendido no tiene', 'productos vendidos no tienen')} costo registrado y no entra{m.missingCost.length === 1 ? '' : 'n'} en el cálculo.</>}
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
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          El más vendido, {short(bestSeller.name)} ({plural(bestSeller.units, 'unidad', 'unidades')}), no está entre los 10 que más utilidad dejan.
        </p>
      )}
      <p className="mb-3 mt-6 text-sm font-semibold text-[var(--color-text)]">Margen más bajo</p>
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
    </InsightCard>
  );

  // 4. Free-shipping threshold
  const threshold = shipping.threshold ?? 0;
  const gap = threshold - shipping.nearFrom;
  const thresholdIndex = shipping.bins.findIndex((b) => b.from >= threshold);
  const shippingCard = (
    <InsightCard
      id="ins-envio"
      headline={shipping.threshold === null ? 'No hay un envío gratis configurado'
        : shipping.near
          ? `${plural(shipping.near, 'pedido', 'pedidos')} (${formatPct(pct(shipping.near, shipping.orders))}) se quedaron a menos de ${formatPrice(gap)} del envío gratis`
          : `Ningún pedido quedó a menos de ${formatPrice(gap)} del envío gratis`}
      context={shipping.threshold === null ? undefined : (
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

  // 5. Coupons
  const couponDirection = coupon.ticketChange >= 0 ? 'más' : 'menos';
  const couponCard = (
    <InsightCard
      id="ins-cupones"
      headline={coupon.withOrders === 0 || coupon.withoutOrders === 0
        ? coupon.withOrders === 0 ? 'Ningún pedido usó cupón en el periodo' : 'Todos los pedidos del periodo usaron cupón'
        : Math.round(Math.abs(coupon.ticketChange)) === 0
          ? `Los pedidos con cupón dejan lo mismo que los demás: ${formatPrice(coupon.withTicket)} netos`
          : `Los pedidos con cupón dejan ${formatPrice(coupon.withTicket)} netos, un ${formatPct(Math.abs(coupon.ticketChange))} ${couponDirection} que los que no lo usan`}
      context={coupon.withOrders > 0 && coupon.withoutOrders > 0 ? (
        <>
          {plural(coupon.withOrders, 'pedido usó', 'pedidos usaron')} cupón ({formatPct(coupon.share)}). Con cupón se llevan {coupon.withUnits.toLocaleString('es-CO')} productos por pedido; sin cupón, {coupon.withoutUnits.toLocaleString('es-CO')}. Ticket neto = productos menos descuento, sin envío.
          {coupon.fewData && <strong className="mt-2 block font-semibold text-[var(--color-text)]">Pocos datos: con menos de {MIN_COUPON_ORDERS} pedidos con cupón, tómalo como una señal, no como una conclusión.</strong>}
        </>
      ) : undefined}
      action={coupon.ticketChange < 0
        ? 'El cupón no está subiendo el ticket: ponle un monto mínimo de compra (por ejemplo, cerca del envío gratis) para que el descuento obligue a llevar un producto más.'
        : 'El cupón acompaña compras más grandes: úsalo en campañas para clientes que ya compraron y mide si repiten.'}
      empty={coupon.withOrders === 0 ? 'Sin pedidos con cupón no hay con qué comparar.'
        : coupon.withoutOrders === 0 ? 'Sin pedidos sin cupón no hay con qué comparar.' : undefined}
      table={<DataTable caption="Pedidos con y sin cupón" head={['', 'Pedidos', 'Ticket neto', 'Productos por pedido']} rows={[
        ['Con cupón', coupon.withOrders, formatPrice(coupon.withTicket), coupon.withUnits.toLocaleString('es-CO')],
        ['Sin cupón', coupon.withoutOrders, formatPrice(coupon.withoutTicket), coupon.withoutUnits.toLocaleString('es-CO')],
      ]} />}
    >
      <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Ticket neto promedio</p>
      <BarChart
        ariaLabel={`Ticket neto: ${formatPrice(coupon.withTicket)} con cupón y ${formatPrice(coupon.withoutTicket)} sin cupón`}
        rows={[
          { key: 'con', label: 'Con cupón', value: coupon.withTicket, valueLabel: formatPrice(coupon.withTicket), tone: 'hi', detail: plural(coupon.withOrders, 'pedido', 'pedidos') },
          { key: 'sin', label: 'Sin cupón', value: coupon.withoutTicket, valueLabel: formatPrice(coupon.withoutTicket), tone: 'ctx', detail: plural(coupon.withoutOrders, 'pedido', 'pedidos') },
        ]}
      />
      <p className="mb-3 mt-6 text-sm font-semibold text-[var(--color-text)]">Productos por pedido</p>
      <BarChart
        ariaLabel={`Productos por pedido: ${coupon.withUnits} con cupón y ${coupon.withoutUnits} sin cupón`}
        rows={[
          { key: 'con', label: 'Con cupón', value: coupon.withUnits, valueLabel: coupon.withUnits.toLocaleString('es-CO'), tone: 'hi' },
          { key: 'sin', label: 'Sin cupón', value: coupon.withoutUnits, valueLabel: coupon.withoutUnits.toLocaleString('es-CO'), tone: 'ctx' },
        ]}
      />
    </InsightCard>
  );

  // 6. Concentration
  const paretoLimit = Math.min(Math.max(15, concentration.coreCount + 3), 30);
  const paretoRows = concentration.items.slice(0, paretoLimit);
  const restCount = concentration.items.length - paretoRows.length;
  const restRevenue = concentration.items.slice(paretoLimit).reduce((s, i) => s + i.revenue, 0);
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
            tone: (i.core ? 'hi' : 'ctx') as Tone, detail: `Acumulado: ${formatPct(i.cumulative)} de los ingresos`,
          })),
          ...(restCount > 0 ? [{ key: 'rest', label: `Otros ${restCount} productos`, value: restRevenue, valueLabel: formatPrice(restRevenue), tone: 'ctx' as const }] : []),
        ]}
      />
    </InsightCard>
  );

  // 7. Franchises
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
      action={overs.length && worst ? `Amplía el surtido de ${list(overs)}; con ${worst.name}, no repongas hasta liquidar lo que tienes.` : undefined}
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

  // 8. When they buy
  const peakDay = time.byDay.indexOf(Math.max(...time.byDay));
  const block = peakBlock(time.byHour);
  const blockHours = new Set([block.start, (block.start + 1) % 24, (block.start + 2) % 24]);
  const hourLabel = (h: number) => `${h}:00`;
  const timingCard = (
    <InsightCard
      id="ins-cuando"
      headline={`Los ${WEEKDAYS_LONG[peakDay]} traen el ${formatPct(pct(time.byDay[peakDay], time.orders))} de los pedidos; la franja más fuerte va de ${hourLabel(block.start)} a ${hourLabel((block.start + 3) % 24)}`}
      context={<>{plural(block.count, 'pedido', 'pedidos')} ({formatPct(pct(block.count, time.orders))}) entraron en esas tres horas. Hora de Colombia, según el momento del pago.</>}
      action={`Programa lanzamientos, correos y publicaciones para el ${WEEKDAYS_ONE[peakDay]} antes de las ${hourLabel(block.start)}, cuando tus clientes ya están listos para comprar.`}
      empty={time.orders < MIN_ORDERS_FOR_PATTERNS ? `Hacen falta al menos ${MIN_ORDERS_FOR_PATTERNS} pedidos para ver un patrón.` : undefined}
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

  // 9. Cities
  const byTicket = [...cityRows].sort((a, b) => b.avgTicket - a.avgTicket);
  const hiCity = byTicket[0];
  const loCity = byTicket[byTicket.length - 1];
  const cityCard = (
    <InsightCard
      id="ins-ciudades"
      headline={hiCity && loCity && cityRows.length > 1
        ? `En ${hiCity.name} cada pedido deja ${formatPrice(hiCity.avgTicket)}, un ${formatPct(pct(hiCity.avgTicket - loCity.avgTicket, loCity.avgTicket))} más que en ${loCity.name}`
        : 'Aún no hay suficientes ciudades para comparar'}
      context={cityRows.length > 1 ? <>{cityRows[0].name} lidera en ventas totales ({formatPct(pct(cityRows[0].revenue, cityRows.reduce((s, c) => s + c.revenue, 0)))}). Ticket = productos menos descuento, sin envío.</> : undefined}
      action={hiCity ? `Prueba anuncios segmentados en ${hiCity.name}: con el mismo costo por clic, cada venta allí deja más.` : undefined}
      empty={cityRows.length > 1 ? undefined : 'Se necesitan pedidos de al menos dos ciudades.'}
      table={<DataTable caption="Ventas por ciudad" head={['Ciudad', 'Pedidos', 'Ventas netas', 'Ticket']} rows={cityRows.map((c) => [c.name, c.orders, formatPrice(c.revenue), formatPrice(c.avgTicket)])} />}
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
      {marginCard}
      {shippingCard}
      {couponCard}
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
    if (rangeDays(draft) > MAX_RANGE_DAYS) return setRangeError(`El periodo puede tener máximo ${MAX_RANGE_DAYS} días.`);
    setRangeError('');
    setPreset(0);
    setRange({ ...draft });
  };

  const { insights, summary, prevSummary, products } = data;

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

      {!(insights && summary && products) ? (
        !data.error && (
          <div className="space-y-6" aria-busy="true" aria-label="Cargando análisis">
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={`${adminCardClass} h-28 animate-pulse`} />)}
            </div>
            <InsightSkeleton />
            <InsightSkeleton />
          </div>
        )
      ) : (
        <div className={`space-y-6 transition-opacity duration-200 ${data.isFetching ? 'opacity-60' : ''}`}>
          <KpiRow summary={summary} prevSummary={prevSummary} insights={insights} days={days} />
          {summary.pedidos === 0 ? (
            <div className={`${adminCardClass} px-6 py-12 text-center`}>
              <p className="text-base font-semibold text-[var(--color-text)]">No hay ventas en este periodo.</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Elige un periodo más largo para ver hallazgos.</p>
            </div>
          ) : (
            <Insights insights={insights} products={products} />
          )}
        </div>
      )}
    </div>
  );
}
