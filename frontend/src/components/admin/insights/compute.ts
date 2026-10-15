import type { AdminProduct, DashboardInsights, DashboardSummary, DateRange } from '@/types/admin';

export const STOCKOUT_HORIZON_DAYS = 30;
/** Below this margin a sale barely pays for itself once ads and packaging are counted. */
export const LOW_MARGIN_PCT = 20;

export const num = (v: string | number | null | undefined) => Number(v ?? 0) || 0;

export function kpis(summary: DashboardSummary) {
  return { revenue: num(summary.ventas_total), orders: summary.pedidos, avgTicket: num(summary.ticket_promedio) };
}

export function rangeDays(range: DateRange): number {
  const a = Date.parse(`${range.desde}T00:00:00Z`);
  const b = Date.parse(`${range.hasta}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The equal-length period right before `range`. */
export function previousRange(range: DateRange): DateRange {
  const n = rangeDays(range);
  return { desde: shiftIso(range.desde, -n), hasta: shiftIso(range.desde, -1) };
}

export const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export function formatPct(value: number): string {
  const abs = Math.abs(value);
  const rounded = abs >= 10 || abs === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString('es-CO')} %`;
}

// ---------- Margen por producto ----------

export interface MarginRow {
  id: string;
  name: string;
  units: number;
  revenue: number;
  profit: number | null;
  marginPct: number | null;
  unitProfit: number | null;
}
export type CostedRow = MarginRow & { profit: number; marginPct: number; unitProfit: number };

export interface MarginInsight {
  rows: MarginRow[];
  costed: CostedRow[];
  missingCost: MarginRow[];
  bestSeller?: MarginRow;
  topProfit?: CostedRow;
  topMargin?: CostedRow;
  /** Costed products under LOW_MARGIN_PCT, worst first (losses included). */
  low: CostedRow[];
  losses: CostedRow[];
}

export function margins(ins: DashboardInsights): MarginInsight {
  const rows: MarginRow[] = ins.margen_por_producto.map((p) => ({
    id: p.product_id,
    name: p.nombre,
    units: p.unidades,
    revenue: num(p.ingresos),
    profit: p.utilidad === null ? null : num(p.utilidad),
    marginPct: p.margen_pct,
    unitProfit: p.utilidad === null || !p.unidades ? null : num(p.utilidad) / p.unidades,
  }));
  const costed = rows.filter((r): r is CostedRow => r.profit !== null && r.marginPct !== null)
    .sort((a, b) => b.profit - a.profit);
  const bestSeller = [...rows].sort((a, b) => b.units - a.units || b.revenue - a.revenue)[0];
  const topMargin = [...costed].sort((a, b) => b.marginPct - a.marginPct || b.profit - a.profit)[0];
  const low = costed.filter((r) => r.marginPct < LOW_MARGIN_PCT).sort((a, b) => a.marginPct - b.marginPct);
  return {
    rows,
    costed,
    missingCost: rows.filter((r) => r.profit === null),
    bestSeller,
    topProfit: costed[0],
    topMargin,
    low,
    losses: low.filter((r) => r.profit < 0),
  };
}

// ---------- Cupones ----------

export const MIN_COUPON_ORDERS = 10;

export function coupons(ins: DashboardInsights) {
  const { con, sin } = ins.cupones;
  const withTicket = num(con.ticket_promedio);
  const withoutTicket = num(sin.ticket_promedio);
  return {
    withOrders: con.pedidos,
    withoutOrders: sin.pedidos,
    withTicket,
    withoutTicket,
    withUnits: con.unidades_promedio,
    withoutUnits: sin.unidades_promedio,
    share: pct(con.pedidos, con.pedidos + sin.pedidos),
    ticketChange: withoutTicket > 0 ? pct(withTicket - withoutTicket, withoutTicket) : 0,
    fewData: con.pedidos < MIN_COUPON_ORDERS,
  };
}

// ---------- Inventario dormido ----------

export interface DormantItem { id: string; name: string; stock: number; value: number; cost: number | null; days: number }
export interface DormantInsight {
  activeCount: number;
  dormantCount: number;
  dormantUnits: number;
  dormantValue: number;
  dormantCost: number;
  missingCost: number;
  totalStockValue: number;
  items: DormantItem[];
}

export function dormantInventory(ins: DashboardInsights, products: AdminProduct[]): DormantInsight {
  const active = products.filter((p) => p.is_active);
  const items = ins.inventario_dormido.map((d) => ({
    id: d.product_id,
    name: d.nombre,
    stock: d.stock,
    value: num(d.valor_precio),
    cost: d.valor_costo === null ? null : num(d.valor_costo),
    days: d.dias_sin_venta,
  }));
  const dormantValue = items.reduce((s, p) => s + p.value, 0);
  return {
    activeCount: active.length,
    dormantCount: items.length,
    dormantUnits: items.reduce((s, p) => s + p.stock, 0),
    dormantValue,
    dormantCost: items.reduce((s, p) => s + (p.cost ?? 0), 0),
    missingCost: items.filter((p) => p.cost === null).length,
    // The product list can lag a fresh sale; never let the whole be smaller than the part.
    totalStockValue: Math.max(dormantValue, active.filter((p) => p.stock > 0).reduce((s, p) => s + p.stock * num(p.base_price), 0)),
    items,
  };
}

// ---------- Riesgo de agotarse ----------

export interface CoverageItem { id: string; name: string; stock: number; perDay: number; days: number }

export function stockCoverage(ins: DashboardInsights) {
  const items: CoverageItem[] = ins.cobertura.map((c) => ({
    id: c.product_id, name: c.nombre, stock: c.stock, perDay: c.unidades_por_dia, days: c.dias_cobertura,
  }));
  return { windowDays: ins.dias, items, atRisk: items.filter((i) => i.days < STOCKOUT_HORIZON_DAYS) };
}

// ---------- Umbral de envío gratis ----------

export interface ShippingBin { from: number; to: number; count: number; zone: 'near' | 'free' | 'other' }

export function shippingThreshold(ins: DashboardInsights, m: MarginInsight) {
  const threshold = ins.umbral_envio_gratis === null ? null : num(ins.umbral_envio_gratis);
  const unitPrices = m.rows.filter((r) => r.units > 0).map((r) => r.revenue / r.units).sort((a, b) => a - b);
  const typicalPrice = unitPrices.length ? unitPrices[Math.floor(unitPrices.length / 2)] : 0;
  const subtotals = ins.subtotales.map(num);
  const step = 50_000;
  const limit = threshold ?? 0;
  // "Near" = one typical item away from free shipping, snapped to the bin grid.
  const nearFrom = Math.max(0, limit - Math.ceil(Math.max(typicalPrice, 1) / step) * step);
  const maxBin = Math.max(limit + 2 * step, Math.ceil((Math.max(0, ...subtotals) + 1) / step) * step);
  const bins: ShippingBin[] = [];
  for (let from = 0; from < maxBin; from += step) {
    const to = from + step;
    bins.push({
      from, to,
      count: subtotals.filter((v) => v >= from && v < to).length,
      zone: from >= limit ? 'free' : from >= nearFrom ? 'near' : 'other',
    });
  }
  return {
    threshold,
    orders: subtotals.length,
    qualifying: subtotals.filter((v) => v >= limit).length,
    near: subtotals.filter((v) => v >= nearFrom && v < limit).length,
    nearFrom,
    typicalPrice,
    bins,
  };
}

// ---------- Concentración (Pareto) ----------

export interface ParetoItem { id: string; name: string; revenue: number; cumulative: number; core: boolean }

export function pareto(m: MarginInsight, catalogCount: number) {
  const sorted = [...m.rows].sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, r) => s + r.revenue, 0);
  let running = 0;
  let coreCount = 0;
  const items: ParetoItem[] = sorted.map((p) => {
    const before = running;
    running += p.revenue;
    const core = pct(before, total) < 80;
    if (core) coreCount += 1;
    return { id: p.id, name: p.name, revenue: p.revenue, cumulative: pct(running, total), core };
  });
  return {
    items,
    coreCount,
    coreShare: items[coreCount - 1]?.cumulative ?? 0,
    soldCount: items.length,
    catalogCount: Math.max(catalogCount, items.length),
    total,
  };
}

// ---------- Franquicias ----------

export interface FranchiseRow { name: string; catalogShare: number; revenueShare: number; revenue: number; products: number; gap: number }

export function franchises(ins: DashboardInsights): FranchiseRow[] {
  const catalog = ins.por_franquicia.reduce((s, f) => s + f.productos_activos, 0);
  const total = ins.por_franquicia.reduce((s, f) => s + num(f.ingresos), 0);
  return ins.por_franquicia.map((f) => {
    const catalogShare = pct(f.productos_activos, catalog);
    const revenueShare = pct(num(f.ingresos), total);
    return {
      name: f.franquicia || 'Sin franquicia',
      catalogShare,
      revenueShare,
      revenue: num(f.ingresos),
      products: f.productos_activos,
      gap: revenueShare - catalogShare,
    };
  });
}

export const catalogSize = (ins: DashboardInsights) => ins.por_franquicia.reduce((s, f) => s + f.productos_activos, 0);

// ---------- Cuándo compran ----------

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_ONE = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

export function timing(ins: DashboardInsights) {
  const byDay = Array(7).fill(0) as number[];
  const byHour = Array(24).fill(0) as number[];
  for (const d of ins.por_dia_semana) byDay[d.dia] = d.pedidos;
  for (const h of ins.por_hora) byHour[h.hora] = h.pedidos;
  return { byDay, byHour, orders: byDay.reduce((s, n) => s + n, 0) };
}

/** Index of the busiest contiguous block of `size` hours (wrapping midnight). */
export function peakBlock(byHour: number[], size = 3): { start: number; count: number } {
  let best = { start: 0, count: -1 };
  for (let h = 0; h < 24; h++) {
    let c = 0;
    for (let k = 0; k < size; k++) c += byHour[(h + k) % 24];
    if (c > best.count) best = { start: h, count: c };
  }
  return best;
}

// ---------- Ciudades ----------

export interface CityRow { name: string; orders: number; revenue: number; avgTicket: number }

export function cities(ins: DashboardInsights): CityRow[] {
  return ins.por_ciudad.map((c) => ({
    name: c.ciudad || 'Sin ciudad', orders: c.pedidos, revenue: num(c.ingresos), avgTicket: num(c.ticket_promedio),
  }));
}

// ---------- Clientes que vuelven ----------

export function repeatCustomers(ins: DashboardInsights) {
  const netSales = ins.por_dia_semana.reduce((s, d) => s + num(d.ingresos), 0);
  return {
    customers: ins.clientes.total,
    repeat: ins.clientes.recurrentes,
    repeatRevenueShare: pct(num(ins.clientes.ingresos_recurrentes), netSales),
  };
}
