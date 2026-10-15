'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Truck } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StaffNotice } from '@/components/auth/StaffNotice';
import { useIsStaff } from '@/hooks/useIsStaff';
import { PaymentReassurance } from '@/components/cart/CartSummary';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useCart } from '@/hooks/useCart';
import { createCheckout, getCheckoutQuote, getShippingZones, type CheckoutQuote } from '@/lib/api';
import { payButtonLabel, payOrder } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import type { ShippingZone } from '@/types/product';

type FieldName =
  | 'shipping_name'
  | 'shipping_phone'
  | 'shipping_address'
  | 'shipping_city'
  | 'shipping_department';

interface FieldConfig {
  name: FieldName;
  label: string;
  type: 'text' | 'tel';
  autoComplete: string;
  placeholder: string;
  wide?: boolean;
  missing: string;
}

const FIELDS: FieldConfig[] = [
  { name: 'shipping_name', label: 'Nombre completo', type: 'text', autoComplete: 'name', placeholder: 'Nombre y apellido', missing: 'Escribe el nombre de quien recibe el pedido.' },
  { name: 'shipping_phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel', placeholder: 'Ej. 300 123 4567', missing: 'Escribe un teléfono para coordinar la entrega.' },
  { name: 'shipping_address', label: 'Dirección', type: 'text', autoComplete: 'street-address', placeholder: 'Ej. Calle 123 # 45-67, apto 101', wide: true, missing: 'Escribe la dirección de entrega.' },
  { name: 'shipping_city', label: 'Ciudad', type: 'text', autoComplete: 'address-level2', placeholder: 'Ej. Bogotá', missing: 'Escribe la ciudad: con ella calculamos el envío.' },
  { name: 'shipping_department', label: 'Departamento', type: 'text', autoComplete: 'address-level1', placeholder: 'Ej. Cundinamarca', missing: 'Escribe el departamento.' },
];

const FALLBACK_ZONE = 'resto del pais';

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

/** Same matching the backend uses to price shipping (apps/shipping/services.find_zone). */
function zoneForCity(zones: ShippingZone[] | undefined, city: string) {
  if (!zones || !city.trim()) return null;
  const target = normalize(city);
  return (
    zones.find((z) => normalize(z.name) === target) ??
    zones.find((z) => normalize(z.name) === FALLBACK_ZONE) ??
    null
  );
}

function validate(form: Record<FieldName, string>): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  for (const field of FIELDS) {
    if (!form[field.name].trim()) errors[field.name] = field.missing;
  }
  const digits = form.shipping_phone.replace(/\D/g, '');
  if (!errors.shipping_phone && digits.length < 7) {
    errors.shipping_phone = 'El teléfono parece incompleto. Revisa que tenga al menos 7 dígitos.';
  }
  return errors;
}

function CheckoutForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, clearCart } = useCart();
  const couponCode = useCartStore((s) => s.couponCode);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [form, setForm] = useState<Record<FieldName, string>>({
    shipping_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    shipping_phone: user?.phone || '',
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_department: user?.department || '',
  });
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteCity, setQuoteCity] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState('');

  const { data: zones } = useQuery<ShippingZone[]>({
    queryKey: ['shipping-zones'],
    queryFn: getShippingZones,
  });
  const zone = zoneForCity(zones, form.shipping_city);

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
          setQuoteCity(form.shipping_city);
          setQuoteError('');
        })
        .catch((err: unknown) => {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'No pudimos calcular el total. Recarga la página.');
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [checkoutItems, form.shipping_city, couponCode]);

  const updateField = (field: FieldName, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0 || loading) return;

    const errors = validate(form);
    setFieldErrors(errors);
    const firstInvalid = FIELDS.find((f) => errors[f.name]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.name)?.focus();
      return;
    }

    setLoading(true);
    setError('');

    let orderId: string | null = null;
    try {
      const order = await createCheckout({
        items: checkoutItems,
        shipping_name: form.shipping_name.trim(),
        shipping_phone: form.shipping_phone.trim(),
        shipping_address: form.shipping_address.trim(),
        shipping_city: form.shipping_city.trim(),
        shipping_department: form.shipping_department.trim(),
        coupon_code: couponCode || undefined,
        notes: notes.trim() || undefined,
      });
      orderId = order.id;

      await payOrder(order.id);
      // The order now holds the items (and reserves their stock).
      clearCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (orderId) {
        // The order exists; the customer can retry the payment from its page.
        clearCart();
        router.push(`/pedido-confirmado/${orderId}?error=payment_init`);
        return;
      }
      setError(
        !message || message.includes('API error')
          ? 'No pudimos crear tu pedido. Revisa tu conexión e intenta de nuevo; no se hizo ningún cobro.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const displaySubtotal = quote ? Number(quote.subtotal) : subtotal;
  const displayDiscount = quote ? Number(quote.discount) : 0;
  const quotedShipping = quote ? Number(quote.shipping_cost) : null;
  // Without a city the backend quotes the fallback zone; free shipping is the only certain value then.
  const cityPending = !form.shipping_city.trim() && quotedShipping !== 0;
  // While the quote for a newly typed city is on its way, the old shipping value would be wrong.
  const quoteIsStale = quoteCity !== null && quoteCity.trim() !== form.shipping_city.trim();
  const shippingCost = cityPending || quoteIsStale ? null : quotedShipping;
  const total = !quote || (quoteIsStale && !cityPending)
    ? null
    : Number(quote.total) - (cityPending ? Number(quote.shipping_cost) : 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="type-page mb-4 text-[var(--color-text)]">Tu carrito está vacío</h1>
        <p className="mb-8 text-base text-[var(--color-text-muted)]">
          Agrega productos antes de finalizar la compra.
        </p>
        <Link
          href="/productos"
          className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  const inputBase =
    'min-h-12 w-full rounded-xl border bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-primary-text)]">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href="/carrito" className="transition-colors hover:text-[var(--color-primary-text)]">Carrito</Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--color-text)]" aria-current="page">Finalizar compra</span>
      </nav>

      <h1 className="type-page mb-8 text-[var(--color-text)]">Finalizar compra</h1>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="space-y-6">
          <section aria-labelledby="shipping-title" className="rounded-2xl bg-[var(--color-bg-alt)] p-5 sm:p-6">
            <h2 id="shipping-title" className="type-sub mb-2 text-[var(--color-text)]">
              Datos de envío
            </h2>
            <p className="mb-5 text-sm text-[var(--color-text-muted)]">Todos los campos son obligatorios.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {FIELDS.map((field) => {
                const fieldError = fieldErrors[field.name];
                const errorId = `${field.name}-error`;
                return (
                  <div key={field.name} className={field.wide ? 'md:col-span-2' : undefined}>
                    <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      inputMode={field.type === 'tel' ? 'tel' : undefined}
                      autoComplete={field.autoComplete}
                      required
                      aria-required="true"
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={fieldError ? errorId : undefined}
                      value={form[field.name]}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      className={`${inputBase} ${fieldError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'}`}
                      placeholder={field.placeholder}
                    />
                    {fieldError && (
                      <p id={errorId} className="mt-1 text-sm text-[var(--color-error)]">
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="md:col-span-2">
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  Notas para la entrega <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputBase} border-[var(--color-border)] py-3`}
                  placeholder="Ej. dejar en portería, horario de entrega"
                />
              </div>
            </div>
          </section>
        </div>

        <div>
          <div className="sticky top-[116px] lg:top-[164px] space-y-5 rounded-2xl bg-[var(--color-bg-alt)] p-5 sm:p-6">
            <h2 className="type-sub text-[var(--color-text)]">Resumen del pedido</h2>

            <ul className="space-y-3">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId || ''}`} className="flex justify-between gap-3 text-base">
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--color-text)]">{item.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--color-text)]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 pt-2 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-muted)]">Subtotal</dt>
                <dd className="font-semibold tabular-nums text-[var(--color-text)]">{formatPrice(displaySubtotal)}</dd>
              </div>
              {displayDiscount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text)]">Cupón {couponCode}</dt>
                  <dd className="font-semibold tabular-nums text-[var(--color-text)]">−{formatPrice(displayDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-muted)]">Envío</dt>
                <dd className="text-right text-[var(--color-text)]">
                  {cityPending ? (
                    <span className="text-[var(--color-text-muted)]">Se calcula al ingresar tu ciudad</span>
                  ) : shippingCost === null ? (
                    <span className="text-[var(--color-text-muted)]">Calculando…</span>
                  ) : shippingCost === 0 ? (
                    <span className="font-semibold">Gratis</span>
                  ) : (
                    <span className="font-semibold tabular-nums">{formatPrice(shippingCost)}</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-3">
                <dt className="font-bold text-[var(--color-text)]">{cityPending ? 'Total sin envío' : 'Total'}</dt>
                <dd className="text-2xl font-bold tabular-nums text-[var(--color-text)]" aria-live="polite">
                  {total === null ? '—' : formatPrice(total)}
                </dd>
              </div>
            </dl>

            {quoteError && (
              <div role="alert" className="rounded-xl border border-[var(--color-error)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-text)]">
                {quoteError}
                {couponCode && (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="mt-1 block min-h-11 font-semibold text-[var(--color-primary-text)] underline"
                  >
                    Quitar el cupón {couponCode}
                  </button>
                )}
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-[var(--color-error)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-error)]">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !quote}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    Creando tu pedido…
                  </>
                ) : (
                  payButtonLabel
                )}
              </button>
              <PaymentReassurance />
              {zone && (
                <p className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Truck className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  Entrega estimada: {zone.min_days}–{zone.max_days} días hábiles
                </p>
              )}
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                Reservamos tus productos por 60 minutos mientras pagas.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutGate />
    </ProtectedRoute>
  );
}

function CheckoutGate() {
  const isStaff = useIsStaff();
  return isStaff ? <StaffNotice /> : <CheckoutForm />;
}
