import type { OrderStatus, PaginatedResponse, ProductImage } from './product';

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  category_id: string;
  category_name: string;
  franchise_id: string;
  franchise_name: string;
  brand_id: string;
  brand_name: string;
  base_price: string;
  compare_price: string | null;
  stock: number;
  low_stock_threshold: number;
  has_variants: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  sale_percentage: number | null;
  images: ProductImage[];
  units_sold: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOptions {
  categories: { id: string; name: string }[];
  franchises: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export interface DateRange {
  desde: string;
  hasta: string;
}

export interface DashboardSummary extends DateRange {
  ventas_total: string;
  pedidos: number;
  /** Net product sales: subtotal minus discounts, shipping excluded. */
  ticket_promedio: string;
  envios_cobrados: string;
  descuentos: string;
  total_cobrado: string;
  unidades_vendidas: number;
  clientes: number;
  pedidos_pendientes_pago: number;
  pedidos_por_despachar: number;
  pedidos_requieren_atencion: number;
  productos_bajo_stock: number;
}

export interface SalesDay {
  fecha: string;
  total: string;
  pedidos: number;
}

export interface SalesByDay extends DateRange {
  dias: SalesDay[];
}

export interface ProductSales {
  product_id: string;
  nombre: string;
  sku: string;
  unidades: number;
  pedidos: number;
  ingresos: string;
}

export interface SalesByProduct extends DateRange {
  productos: ProductSales[];
}

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  sold_at: string;
  total: string;
  subtotal: string;
  discount: string;
  shipping_cost: string;
  shipping_city: string;
  cliente_email: string;
  cliente_nombre: string;
  unidades: number | null;
  metodo_pago: string;
  productos: { nombre: string; variante: string; cantidad: number }[];
  tracking_number: string;
  requires_attention: boolean;
}

export type AdminOrderPage = PaginatedResponse<AdminOrder>;

export type ShippableStatus = 'shipped' | 'delivered';

export interface AdminOrderUpdate {
  status: ShippableStatus;
  tracking_number?: string;
  shipping_carrier?: string;
}

export interface ProductMargin {
  product_id: string;
  nombre: string;
  franquicia: string;
  unidades: number;
  ingresos: string;
  /** Null when the product has no recorded import cost. */
  costo: string | null;
  utilidad: string | null;
  margen_pct: number | null;
}

export interface CouponGroup {
  pedidos: number;
  ticket_promedio: string;
  unidades_promedio: number;
}

export interface DashboardInsights extends DateRange {
  dias: number;
  /** Sorted by profit, highest first; products without cost last. */
  margen_por_producto: ProductMargin[];
  utilidad_total: string;
  margen_promedio_pct: number | null;
  /** 0 = Monday. */
  por_dia_semana: { dia: number; pedidos: number; ingresos: string }[];
  /** Bogotá time. */
  por_hora: { hora: number; pedidos: number; ingresos: string }[];
  subtotales: string[];
  umbral_envio_gratis: string | null;
  cupones: { con: CouponGroup; sin: CouponGroup };
  clientes: { total: number; recurrentes: number; ingresos_recurrentes: string };
  por_ciudad: { ciudad: string; pedidos: number; ingresos: string; ticket_promedio: string }[];
  por_franquicia: { franquicia: string; ingresos: string; unidades: number; productos_activos: number }[];
  inventario_dormido: {
    product_id: string;
    nombre: string;
    stock: number;
    valor_precio: string;
    valor_costo: string | null;
    dias_sin_venta: number;
  }[];
  cobertura: { product_id: string; nombre: string; stock: number; unidades_por_dia: number; dias_cobertura: number }[];
}
