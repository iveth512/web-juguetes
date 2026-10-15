export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: string | null;
  display_order: number;
  product_count: number;
}

export interface Franchise {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface ProductImage {
  id: string;
  image: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string; // decimal as string from API
  compare_price: string | null;
  stock: number;
  is_active: boolean;
  display_order: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string; // name from SlugRelatedField
  franchise: string; // name
  sku: string;
  base_price: string;
  compare_price: string | null;
  has_variants: boolean;
  stock: number;
  low_stock_threshold: number;
  is_new: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_percentage: number | null;
  primary_image_url: string | null;
  tags: string[];
  average_rating: number | null;
  review_count: number;
  created_at: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: Category;
  franchise: Franchise;
  brand: Brand;
  sku: string;
  base_price: string;
  compare_price: string | null;
  has_variants: boolean;
  stock: number;
  low_stock_threshold: number;
  is_new: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_percentage: number | null;
  weight_grams: number | null;
  dimensions: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  related_products: ProductListItem[];
  average_rating: number | null;
  review_count: number;
  created_at: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  price: string;
  min_days: number;
  max_days: number;
  free_shipping_threshold: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Review {
  id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface CouponResult {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  discount_amount: string;
}

export interface OrderItemResponse {
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_name: string;
  quantity: number;
  price: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  shipping_cost: string;
  total: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_carrier: string;
  tracking_number: string;
  coupon: string | null;
  notes: string;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  expires_at: string | null;
  items: OrderItemResponse[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente de pago',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};
