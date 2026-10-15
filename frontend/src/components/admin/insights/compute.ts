import type { AdminOrder, AdminProduct, DateRange, ProductSales } from '@/types/admin';

export const FREE_SHIPPING_THRESHOLD = 250_000;
export const STOCKOUT_HORIZON_DAYS = 30;
const VELOCITY_WINDOW_DAYS = 30;
const TZ = 'America/Bogota';

const num = (v: string | number | null | undefined) => Number(v ?? 0) || 0;

/** Product revenue of an order: subtotal minus discount, shipping excluded. */
export const orderRevenue = (o: AdminOrder) => num(o.subtotal) - num(o.discount);

export function kpis(orders: AdminOrder[]) {
  const revenue = orders.reduce((s, o) => s + orderRevenue(o), 0);
  return { revenue, orders: orders.length, avgTicket: orders.length ? revenue / orders.length : 0 };
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

const localParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
});
const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function local(iso: string) {
  const parts = Object.fromEntries(localParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
    hour: Number(parts.hour) % 24,
  };
}

export const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export function formatPct(value: number): string {
  const rounded = value >= 10 || value === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString('es-CO')} %`;
}

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// ---------- Inventario dormido ----------

export interface DormantItem { id: string; name: string; stock: number; value: number }
export interface DormantInsight {
  activeCount: number;
  dormantCount: number;
  dormantUnits: number;
  dormantValue: number;
  totalStockValue: number;
  items: DormantItem[];
}

export function dormantInventory(products: AdminProduct[], soldIds: Set<string>, soldNames: Set<string>): DormantInsight {
  const active = products.filter((p) => p.is_active);
  const stocked = active.filter((p) => p.stock > 0);
  const dormant = stocked
    .filter((p) => !soldIds.has(p.id) && !soldNames.has(p.name))
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, value: p.stock * num(p.base_price) }))
    .sort((a, b) => b.value - a.value);
  return {
    activeCount: active.length,
    dormantCount: dormant.length,
    dormantUnits: dormant.reduce((s, p) => s + p.stock, 0),
    dormantValue: dormant.reduce((s, p) => s + p.value, 0),
    totalStockValue: stocked.reduce((s, p) => s + p.stock * num(p.base_price), 0),
    items: dormant,
  };
}

// ---------- Riesgo de agotarse ----------

export interface CoverageItem { id: string; name: string; stock: number; units: number; days: number }
export interface CoverageInsight { windowDays: number; items: CoverageItem[]; atRisk: CoverageItem[] }

export function stockCoverage(
  orders: AdminOrder[], products: AdminProduct[], range: DateRange, topSellers: ProductSales[],
): CoverageInsight {
  const windowDays = Math.min(VELOCITY_WINDOW_DAYS, rangeDays(range));
  const since = shiftIso(range.hasta, -(windowDays - 1));
  const unitsByName = new Map<string, number>();
  for (const o of orders) {
    if (local(o.sold_at).date < since) continue;
    for (const line of o.productos) unitsByName.set(line.nombre, (unitsByName.get(line.nombre) ?? 0) + line.cantidad);
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CoverageItem[] = [];
  for (const s of topSellers.slice(0, 12)) {
    const product = byId.get(s.product_id);
    const units = unitsByName.get(s.nombre) ?? 0;
    if (!product || !product.is_active || units === 0) continue;
    items.push({ id: s.product_id, name: s.nombre, stock: product.stock, units, days: product.stock / (units / windowDays) });
  }
  items.sort((a, b) => a.days - b.days);
  return { windowDays, items, atRisk: items.filter((i) => i.days < STOCKOUT_HORIZON_DAYS) };
}

// ---------- Umbral de envío gratis ----------

export interface ShippingBin { from: number; to: number; count: number; zone: 'near' | 'free' | 'other' }
export interface ShippingInsight {
  orders: number;
  qualifying: number;
  near: number;
  nearFrom: number;
  typicalPrice: number;
  nearShippingPaid: number;
  bins: ShippingBin[];
}

export function shippingThreshold(orders: AdminOrder[], products: AdminProduct[], soldNames: Set<string>): ShippingInsight {
  const prices = products.filter((p) => soldNames.has(p.name)).map((p) => num(p.base_price)).sort((a, b) => a - b);
  const typicalPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
  const step = 50_000;
  // "Near" = one typical item away from free shipping, snapped to the bin grid.
  const nearFrom = Math.max(0, FREE_SHIPPING_THRESHOLD - Math.ceil(Math.max(typicalPrice, 1) / step) * step);
  const subtotals = orders.map(orderRevenue);
  const maxBin = Math.max(FREE_SHIPPING_THRESHOLD + 2 * step, Math.ceil((Math.max(0, ...subtotals) + 1) / step) * step);
  const bins: ShippingBin[] = [];
  for (let from = 0; from < maxBin; from += step) {
    const to = from + step;
    bins.push({
      from, to,
      count: subtotals.filter((v) => v >= from && v < to).length,
      zone: from >= FREE_SHIPPING_THRESHOLD ? 'free' : from >= nearFrom ? 'near' : 'other',
    });
  }
  const nearOrders = orders.filter((o, i) => subtotals[i] >= nearFrom && subtotals[i] < FREE_SHIPPING_THRESHOLD);
  return {
    orders: orders.length,
    qualifying: subtotals.filter((v) => v >= FREE_SHIPPING_THRESHOLD).length,
    near: nearOrders.length,
    nearFrom,
    typicalPrice,
    nearShippingPaid: nearOrders.reduce((s, o) => s + num(o.shipping_cost), 0),
    bins,
  };
}

// ---------- Concentración (Pareto) ----------

export interface ParetoItem { id: string; name: string; revenue: number; cumulative: number; core: boolean }
export interface ParetoInsight {
  items: ParetoItem[];
  coreCount: number;
  coreShare: number;
  soldCount: number;
  catalogCount: number;
  total: number;
  tailRevenue: number;
  tailCount: number;
}

export function pareto(topSellers: ProductSales[], orders: AdminOrder[], catalogCount: number, soldNames: Set<string>): ParetoInsight {
  const total = orders.reduce((s, o) => s + num(o.subtotal), 0);
  let running = 0;
  let coreCount = 0;
  const items = topSellers.map((p) => {
    const revenue = num(p.ingresos);
    const before = running;
    running += revenue;
    const core = pct(before, total) < 80;
    if (core) coreCount += 1;
    return { id: p.product_id, name: p.nombre, revenue, cumulative: pct(running, total), core };
  });
  const coreShare = items[coreCount - 1]?.cumulative ?? 0;
  return {
    items,
    coreCount,
    coreShare,
    soldCount: Math.max(soldNames.size, items.length),
    catalogCount,
    total,
    tailRevenue: Math.max(0, total - running),
    tailCount: Math.max(0, soldNames.size - items.length),
  };
}

// ---------- Franquicias ----------

export interface FranchiseRow { name: string; catalogShare: number; revenueShare: number; revenue: number; products: number; gap: number }

export function franchises(products: AdminProduct[], topSellers: ProductSales[]): FranchiseRow[] {
  const active = products.filter((p) => p.is_active);
  const byId = new Map(products.map((p) => [p.id, p]));
  const count = new Map<string, number>();
  for (const p of active) count.set(p.franchise_name || 'Sin franquicia', (count.get(p.franchise_name || 'Sin franquicia') ?? 0) + 1);
  const revenue = new Map<string, number>();
  let total = 0;
  for (const s of topSellers) {
    const f = byId.get(s.product_id)?.franchise_name || 'Sin franquicia';
    revenue.set(f, (revenue.get(f) ?? 0) + num(s.ingresos));
    total += num(s.ingresos);
  }
  const names = new Set([...count.keys(), ...revenue.keys()]);
  return [...names].map((name) => {
    const catalogShare = pct(count.get(name) ?? 0, active.length);
    const revenueShare = pct(revenue.get(name) ?? 0, total);
    return { name, catalogShare, revenueShare, revenue: revenue.get(name) ?? 0, products: count.get(name) ?? 0, gap: revenueShare - catalogShare };
  });
}

// ---------- Cuándo compran ----------

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_ONE = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

export function timing(orders: AdminOrder[]) {
  const byDay = Array(7).fill(0) as number[];
  const byHour = Array(24).fill(0) as number[];
  for (const o of orders) {
    const t = local(o.sold_at);
    byDay[t.weekday] += 1;
    byHour[t.hour] += 1;
  }
  return { byDay, byHour };
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

export function cities(orders: AdminOrder[]): CityRow[] {
  const groups = new Map<string, { spellings: Map<string, number>; orders: number; revenue: number }>();
  for (const o of orders) {
    const raw = o.shipping_city.trim() || 'Sin ciudad';
    const key = stripAccents(raw);
    const g = groups.get(key) ?? { spellings: new Map(), orders: 0, revenue: 0 };
    g.spellings.set(raw, (g.spellings.get(raw) ?? 0) + 1);
    g.orders += 1;
    g.revenue += orderRevenue(o);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => {
      // Prefer the accented spelling ("Bogotá" over "Bogota") when both appear.
      const spellings = [...g.spellings.keys()].sort((a, b) => b.normalize('NFD').length - a.normalize('NFD').length);
      return { name: spellings[0], orders: g.orders, revenue: g.revenue, avgTicket: g.revenue / g.orders };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

// ---------- Clientes que vuelven ----------

export function repeatCustomers(orders: AdminOrder[]) {
  const byCustomer = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const c = byCustomer.get(o.cliente_email) ?? { orders: 0, revenue: 0 };
    c.orders += 1;
    c.revenue += orderRevenue(o);
    byCustomer.set(o.cliente_email, c);
  }
  const all = [...byCustomer.values()];
  const repeat = all.filter((c) => c.orders >= 2);
  const total = all.reduce((s, c) => s + c.revenue, 0);
  return {
    customers: all.length,
    repeat: repeat.length,
    repeatRevenueShare: pct(repeat.reduce((s, c) => s + c.revenue, 0), total),
  };
}

export function soldNameSet(orders: AdminOrder[]): Set<string> {
  return new Set(orders.flatMap((o) => o.productos.map((p) => p.nombre)));
}
