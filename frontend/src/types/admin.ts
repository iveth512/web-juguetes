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
  ticket_promedio: string;
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
