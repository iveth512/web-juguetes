'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useCart } from '@/hooks/useCart';
import { createCheckout, getCheckoutQuote, type CheckoutQuote } from '@/lib/api';
import { payButtonLabel, paymentHint, payOrder } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';

function CheckoutForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, clearCart } = useCart();
  const couponCode = useCartStore((s) => s.couponCode);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [form, setForm] = useState({
    shipping_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    shipping_phone: user?.phone || '',
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_department: user?.department || '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        ...(item.variantId ? { variant_id: item.variantId } : {}),
        quantity: item.quantity,
      })),
    [items]
  );

  // The backend prices the order (shipping zone, coupon, variants); show exactly that.
  useEffect(() => {
    if (checkoutItems.length === 0) return;
    const timer = setTimeout(() => {
      getCheckoutQuote({
        items: checkoutItems,
        shipping_city: form.shipping_city,
        coupon_code: couponCode || undefined,
      })
        .then((q) => {
          setQuote(q);
          setQuoteError('');
        })
        .catch((err: unknown) => {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'No se pudo calcular el total.');
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [checkoutItems, form.shipping_city, couponCode]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    let orderId: string | null = null;
    try {
      const order = await createCheckout({
        items: checkoutItems,
        shipping_name: form.shipping_name,
        shipping_phone: form.shipping_phone,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_department: form.shipping_department,
        coupon_code: couponCode || undefined,
        notes: form.notes || undefined,
      });
      orderId = order.id;

      await payOrder(order.id);
      // The order now holds the items (and reserves their stock).
      clearCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el pedido';
      if (orderId) {
        // The order exists; the customer can retry the payment from its page.
        clearCart();
        router.push(`/pedido-confirmado/${orderId}?error=payment_init`);
        return;
      }
      setError(message.includes('API error') ? 'Error al procesar el pedido. Intenta de nuevo.' : message);
    } finally {
      setLoading(false);
    }
  };

  const displaySubtotal = quote ? Number(quote.subtotal) : subtotal;
  const displayDiscount = quote ? Number(quote.discount) : 0;
  const shippingCost = quote ? Number(quote.shipping_cost) : null;
  const total = quote ? Number(quote.total) : null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-4">
          Tu carrito esta vacio
        </h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          Agrega productos antes de continuar al checkout.
        </p>
        <Link
          href="/productos"
          className="inline-block px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/carrito" className="hover:text-[var(--color-primary)] transition-colors">Carrito</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text)]">Checkout</span>
      </nav>

      <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-8">
        Finalizar compra
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: shipping form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de envio */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold text-[var(--color-text)] mb-4">
              Datos de envio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={form.shipping_name}
                  onChange={(e) => updateField('shipping_name', e.target.value)}
                  className={inputClass}
                  placeholder="Juan Perez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Telefono *
                </label>
                <input
                  type="tel"
                  required
                  value={form.shipping_phone}
                  onChange={(e) => updateField('shipping_phone', e.target.value)}
                  className={inputClass}
                  placeholder="300 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Direccion *
                </label>
                <input
                  type="text"
                  required
                  value={form.shipping_address}
                  onChange={(e) => updateField('shipping_address', e.target.value)}
                  className={inputClass}
                  placeholder="Calle 123 #45-67, Apto 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={form.shipping_city}
                  onChange={(e) => updateField('shipping_city', e.target.value)}
                  className={inputClass}
                  placeholder="Bogota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Departamento *
                </label>
                <input
                  type="text"
                  required
                  value={form.shipping_department}
                  onChange={(e) => updateField('shipping_department', e.target.value)}
                  className={inputClass}
                  placeholder="Cundinamarca"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: order summary */}
        <div className="space-y-6">
          {/* Resumen del pedido */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6 sticky top-[100px] lg:top-[180px]">
            <h2 className="font-heading text-lg font-bold text-[var(--color-text)] mb-4">
              Resumen del pedido
            </h2>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId || ''}`} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text)] truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{item.variantName}</p>
                    )}
                    <p className="text-[var(--color-text-muted)]">x{item.quantity}</p>
                  </div>
                  <span className="font-semibold text-[var(--color-text)] ml-2">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-[var(--color-border)] mb-4" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Subtotal</span>
                <span className="font-semibold text-[var(--color-text)]">{formatPrice(displaySubtotal)}</span>
              </div>
              {displayDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Cupon ({couponCode})</span>
                  <span className="font-semibold text-green-600">-{formatPrice(displayDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Envio</span>
                {shippingCost === null ? (
                  <span className="text-[var(--color-text-muted)]">Calculando...</span>
                ) : shippingCost === 0 ? (
                  <span className="font-semibold text-green-600">Gratis!</span>
                ) : (
                  <span className="font-semibold text-[var(--color-text)]">{formatPrice(shippingCost)}</span>
                )}
              </div>
            </div>

            <hr className="border-[var(--color-border)] my-4" />

            <div className="flex justify-between mb-4">
              <span className="text-base font-bold text-[var(--color-text)]">Total</span>
              <span className="font-heading text-xl font-extrabold text-[var(--color-primary)]">
                {total === null ? '—' : formatPrice(total)}
              </span>
            </div>

            {quoteError && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                {quoteError}
                {couponCode && (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="block mt-1 underline font-semibold"
                  >
                    Quitar cupon {couponCode}
                  </button>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Instrucciones especiales para tu pedido..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !quote}
              className="w-full py-3.5 rounded-lg text-base font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                payButtonLabel
              )}
            </button>
            <p className="mt-3 text-xs text-center text-[var(--color-text-muted)]">
              {paymentHint}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutForm />
    </ProtectedRoute>
  );
}
