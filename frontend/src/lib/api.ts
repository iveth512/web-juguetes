import type {
  Category,
  Franchise,
  Brand,
  ProductListItem,
  ProductDetail,
  ShippingZone,
  PaginatedResponse,
  Review,
  CouponResult,
  OrderResponse,
} from "@/types/product";
import type { User } from "@/types/auth";
import type {
  AdminOptions,
  AdminOrder,
  AdminOrderPage,
  AdminOrderUpdate,
  AdminProduct,
  DashboardInsights,
  DashboardSummary,
  DateRange,
  SalesByDay,
  SalesByProduct,
} from "@/types/admin";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: use internal Docker network URL
    return process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

export class ApiError extends Error {
  status: number;
  /** Per-field validation messages (DRF 400 bodies), when the caller asked for them. */
  fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfFallback: string | null = null;

// The backend authenticates with JWT cookies and therefore enforces CSRF on
// writes: send the csrftoken cookie back as X-CSRFToken.
async function getCsrfToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!forceRefresh) {
    const fromCookie = readCookie("csrftoken");
    if (fromCookie) return fromCookie;
    if (csrfFallback) return csrfFallback;
  }
  const res = await fetch(`${getBaseUrl()}/auth/csrf/`, { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { csrfToken: string };
  csrfFallback = data.csrfToken;
  return readCookie("csrftoken") || csrfFallback;
}

function throttledMessage(res: Response): string {
  const seconds = Number(res.headers.get("Retry-After"));
  if (!seconds || Number.isNaN(seconds)) {
    return "Demasiados intentos. Espera un momento e intenta de nuevo.";
  }
  const wait = seconds < 60
    ? `${Math.ceil(seconds)} segundos`
    : `${Math.ceil(seconds / 60)} ${Math.ceil(seconds / 60) === 1 ? "minuto" : "minutos"}`;
  return `Demasiados intentos. Por seguridad, intenta de nuevo en ${wait}.`;
}

async function errorMessage(res: Response): Promise<string> {
  // DRF's own throttling text is unclear in Spanish; ours says how long to wait.
  if (res.status === 429) return throttledMessage(res);
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
    if (data && typeof data === "object") {
      const first = Object.values(data)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
  } catch {
    // not JSON
  }
  return `API error: ${res.status} ${res.statusText}`;
}

async function request(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (UNSAFE_METHODS.has(method)) {
    const token = await getCsrfToken(isRetry);
    if (token) headers.set("X-CSRFToken", token);
  }

  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // The API rejects every request, even public reads and a login, while the browser holds a bad
  // session cookie: an expired access token (30 min) is renewed once; a session whose user no
  // longer exists (e.g. after the demo database is reset) is dropped, and the request retried.
  if (res.status === 401 && !isRetry && typeof window !== "undefined") {
    const body = await res.clone().text();
    if (body.includes("user_not_found") || body.includes("token_not_valid")) {
      const renewed =
        body.includes("token_not_valid") &&
        (await request("/auth/token/refresh/", { method: "POST" }, true)).ok;
      if (!renewed) await fetch("/session-reset", { method: "POST", credentials: "include" });
      return request(endpoint, options, true);
    }
  }

  // A stale CSRF token (e.g. rotated at login) gets one retry with a fresh one.
  if (res.status === 403 && UNSAFE_METHODS.has(method) && !isRetry) {
    const body = await res.clone().text();
    if (body.includes("CSRF")) return request(endpoint, options, true);
  }
  return res;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await request(endpoint, options);
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Products
export function getProducts(
  params?: Record<string, string>
): Promise<PaginatedResponse<ProductListItem>> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return fetchApi<PaginatedResponse<ProductListItem>>(`/products/${query}`);
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return fetchApi<ProductDetail>(`/products/${slug}/`);
}

export function getFeaturedProducts(): Promise<
  PaginatedResponse<ProductListItem>
> {
  return fetchApi<PaginatedResponse<ProductListItem>>(
    "/products/?is_featured=true"
  );
}

export function getNewProducts(): Promise<
  PaginatedResponse<ProductListItem>
> {
  return fetchApi<PaginatedResponse<ProductListItem>>(
    "/products/?is_new=true"
  );
}

export function getOnSaleProducts(): Promise<
  PaginatedResponse<ProductListItem>
> {
  return fetchApi<PaginatedResponse<ProductListItem>>(
    "/products/?is_on_sale=true"
  );
}

// Categories
export function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>("/categories/");
}

// Franchises
export function getFranchises(): Promise<Franchise[]> {
  return fetchApi<Franchise[]>("/franchises/");
}

// Brands
export function getBrands(): Promise<Brand[]> {
  return fetchApi<Brand[]>("/brands/");
}

// Search (uses PostgreSQL full-text search endpoint)
export function searchProducts(
  query: string,
  page?: number
): Promise<PaginatedResponse<ProductListItem>> {
  const params = new URLSearchParams({ q: query });
  if (page) params.set("page", page.toString());
  return fetchApi<PaginatedResponse<ProductListItem>>(
    `/search/?${params.toString()}`
  );
}

// Shipping
export function getShippingZones(): Promise<ShippingZone[]> {
  return fetchApi<ShippingZone[]>("/shipping-zones/");
}

// Auth
export function authLogin(data: { email: string; password: string; remember?: boolean }) {
  return fetchApi<{ user: User }>('/auth/login/', { method: 'POST', body: JSON.stringify(data) });
}

export function authRegister(data: { email: string; password1: string; password2: string; first_name: string; last_name: string }) {
  return fetchApi<{ user: User }>('/auth/register/', { method: 'POST', body: JSON.stringify(data) });
}

export function authLogout() {
  return fetchApi<void>('/auth/logout/', { method: 'POST' });
}

export function authGetUser() {
  return fetchApi<User>('/auth/user/');
}

export function authUpdateUser(data: Partial<User>) {
  return fetchApi<User>('/auth/user/', { method: 'PATCH', body: JSON.stringify(data) });
}

export function authChangePassword(data: { old_password: string; new_password1: string; new_password2: string }) {
  return fetchApi<void>('/auth/password/change/', { method: 'POST', body: JSON.stringify(data) });
}

export function authGoogleLogin(accessToken: string) {
  return fetchApi<{ user: User }>('/auth/google/', { method: 'POST', body: JSON.stringify({ access_token: accessToken }) });
}

export function authRefreshToken() {
  return fetchApi<void>('/auth/token/refresh/', { method: 'POST' });
}

// Wishlist
export function getWishlist(): Promise<ProductListItem[]> {
  return fetchApi<ProductListItem[]>('/wishlist/');
}

export function addToWishlist(productId: string) {
  return fetchApi<{ detail: string }>('/wishlist/', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
}

export function removeFromWishlist(productId: string) {
  return fetchApi<void>(`/wishlist/${productId}/`, { method: 'DELETE' });
}

// Reviews
export function getReviews(productSlug: string): Promise<Review[]> {
  return fetchApi<Review[]>(`/reviews/?product=${productSlug}`);
}

export function createReview(data: { product_id: string; rating: number; title: string; comment: string }) {
  return fetchApi<Review>('/reviews/', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteReview(reviewId: string) {
  return fetchApi<void>(`/reviews/${reviewId}/`, { method: 'DELETE' });
}

// Coupons
export function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  return fetchApi<CouponResult>('/coupons/validate/', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal: subtotal.toFixed(2) }),
  });
}

// Password reset
export function authRequestPasswordReset(email: string) {
  return fetchApi<{ detail: string }>('/auth/password/reset/', { method: 'POST', body: JSON.stringify({ email }) });
}

export function authConfirmPasswordReset(data: { uid: string; token: string; new_password1: string; new_password2: string }) {
  return fetchApi<{ detail: string }>('/auth/password/reset/confirm/', { method: 'POST', body: JSON.stringify(data) });
}

// Checkout & Orders
export interface CheckoutItemInput {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface CheckoutQuote {
  subtotal: string;
  discount: string;
  shipping_cost: string;
  total: string;
  coupon: string | null;
}

export function getCheckoutQuote(data: { items: CheckoutItemInput[]; shipping_city?: string; coupon_code?: string }) {
  return fetchApi<CheckoutQuote>('/checkout/quote/', { method: 'POST', body: JSON.stringify(data) });
}

export function createCheckout(data: {
  items: CheckoutItemInput[];
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  coupon_code?: string;
  notes?: string;
}) {
  return fetchApi<OrderResponse>('/checkout/', { method: 'POST', body: JSON.stringify(data) });
}

export function getOrders(): Promise<OrderResponse[]> {
  return fetchApi<OrderResponse[]>('/orders/');
}

export function getOrderDetail(id: string): Promise<OrderResponse> {
  return fetchApi<OrderResponse>(`/orders/${id}/`);
}

export function cancelOrder(id: string): Promise<OrderResponse> {
  return fetchApi<OrderResponse>(`/orders/${id}/cancel/`, { method: 'POST' });
}

// Payments (Bold)
export interface BoldCheckoutConfig {
  orderId: string;
  currency: string;
  amount: string;
  apiKey: string;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
  originUrl: string;
  expirationDate: string;
  customerData: string;
}

export function initBoldPayment(orderId: string) {
  return fetchApi<{ script_url: string; config: BoldCheckoutConfig }>(
    `/payments/bold/init/${orderId}/`,
    { method: 'POST' }
  );
}

export function syncOrderPayment(orderId: string): Promise<OrderResponse> {
  return fetchApi<OrderResponse>(`/payments/orders/${orderId}/sync/`, { method: 'POST' });
}

// Admin: products
function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function getAdminOptions(): Promise<AdminOptions> {
  return fetchApi<AdminOptions>('/admin/options/');
}

export function adminListProducts(params: {
  q?: string;
  estado?: string;
  orden?: string;
  franquicia?: string;
  page?: number;
}): Promise<PaginatedResponse<AdminProduct>> {
  return fetchApi<PaginatedResponse<AdminProduct>>(`/admin/products/${toQuery(params)}`);
}

export function adminGetProduct(productId: string): Promise<AdminProduct> {
  return fetchApi<AdminProduct>(`/admin/products/${productId}/`);
}

export function adminCreateProduct(formData: FormData): Promise<AdminProduct> {
  return fetchApi<AdminProduct>('/admin/products/', { method: 'POST', body: formData });
}

export function adminUpdateProduct(productId: string, formData: FormData): Promise<AdminProduct> {
  return fetchApi<AdminProduct>(`/admin/products/${productId}/`, { method: 'PATCH', body: formData });
}

/** Products with sales are deactivated instead of deleted (`deactivated: true`). */
export function adminDeleteProduct(productId: string): Promise<{ detail: string; deactivated: boolean } | undefined> {
  return fetchApi(`/admin/products/${productId}/`, { method: 'DELETE' });
}

// Admin: sales dashboard
export function getDashboardSummary(range: Partial<DateRange>): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>(`/admin/dashboard/summary/${toQuery(range)}`);
}

export function getSalesByDay(range: Partial<DateRange>): Promise<SalesByDay> {
  return fetchApi<SalesByDay>(`/admin/dashboard/sales-by-day/${toQuery(range)}`);
}

export function getSalesByProduct(range: Partial<DateRange> & { limite?: number }): Promise<SalesByProduct> {
  return fetchApi<SalesByProduct>(`/admin/dashboard/sales-by-product/${toQuery(range)}`);
}

export function getDashboardInsights(range: DateRange): Promise<DashboardInsights> {
  return fetchApi<DashboardInsights>(`/admin/dashboard/insights/${toQuery({ ...range })}`);
}

/** Moves a sale forward: paid → shipped → delivered. */
export async function adminUpdateOrder(orderId: string, data: AdminOrderUpdate): Promise<AdminOrder> {
  const res = await request(`/admin/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify(data) });
  if (res.ok) return res.json();
  const message = await errorMessage(res.clone());
  const fields: Record<string, string> = {};
  try {
    const body = await res.json();
    if (body && typeof body === 'object') {
      for (const [k, v] of Object.entries(body)) {
        const text = Array.isArray(v) ? v[0] : v;
        if (typeof text === 'string') fields[k] = text;
      }
    }
  } catch {
    // not JSON
  }
  throw new ApiError(res.status, message, fields);
}

export function adminListOrders(params: Partial<DateRange> & { estado?: string; q?: string; page?: number }): Promise<AdminOrderPage> {
  return fetchApi<AdminOrderPage>(`/admin/orders/${toQuery(params)}`);
}

// Payments: gateway-agnostic start (Bold or the local simulated gateway)
export type PaymentStart =
  | { provider: 'bold'; script_url: string; config: BoldCheckoutConfig }
  | { provider: 'simulado'; checkout_url: string };

export function initPayment(orderId: string) {
  return fetchApi<PaymentStart>(`/payments/init/${orderId}/`, { method: 'POST' });
}

export interface SimulatedCharge {
  reference: string;
  status: 'pending' | 'approved' | 'rejected' | 'voided';
  amount: string;
  currency: string;
  description: string;
  order_id: string;
  order_status: string;
  items: { nombre: string; variante: string; cantidad: number; precio: string }[];
}

export function getSimulatedCharge(reference: string) {
  return fetchApi<SimulatedCharge>(`/payments/simulado/${reference}/`);
}

export function resolveSimulatedCharge(reference: string, resultado: 'aprobado' | 'rechazado') {
  return fetchApi<{ order_id: string; payment_status: string; order_status: string }>(
    `/payments/simulado/${reference}/`,
    { method: 'POST', body: JSON.stringify({ resultado }) }
  );
}
