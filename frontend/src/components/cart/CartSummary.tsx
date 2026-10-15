'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Truck, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { validateCoupon } from '@/lib/api';
import { paymentProvider } from '@/lib/payments';

/** Mirrors the backend default (SHIPPING_FREE_THRESHOLD and every seeded zone). */
export const FREE_SHIPPING_THRESHOLD = 250000;

const UNKNOWN_COUPON = 'Ese cupón no existe o ya venció. Revisa que esté bien escrito.';

function couponErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  // The backend's generic "not valid" text gives no recovery; specific reasons
  // (minimum purchase, usage limit, throttling) are worth showing as they are.
  if (!message || message.startsWith('API error') || /^cup[oó]n no v[aá]lido/i.test(message)) {
    return UNKNOWN_COUPON;
  }
  return message;
}

export function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <Truck className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden="true" />
        {remaining === 0 ? (
          <span className="font-semibold">¡Tienes envío gratis!</span>
        ) : (
          <span>
            Te faltan <span className="font-semibold">{formatPrice(remaining)}</span> para el envío gratis
          </span>
        )}
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]"
        role="progressbar"
        aria-label="Progreso hacia el envío gratis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function PaymentReassurance() {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
      <Lock className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {paymentProvider === 'simulado'
        ? 'Pasarela de prueba: no se realiza ningún cobro'
        : 'Pago seguro con Bold'}
    </p>
  );
}

export function CartSummary() {
  const { subtotal, isFreeShipping } = useCart();
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [inputCode, setInputCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Shipping depends on the destination city; it is priced at checkout.
  const total = subtotal - couponDiscount;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const result = await validateCoupon(inputCode.trim(), subtotal);
      applyCoupon(result.code, parseFloat(result.discount_amount));
      setInputCode('');
    } catch (err: unknown) {
      setCouponError(couponErrorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  const handleCheckout = () => {
    router.push(isAuthenticated ? '/checkout' : '/login?next=/checkout');
  };

  return (
    <div className="sticky top-[116px] lg:top-[164px] space-y-5 rounded-2xl bg-[var(--color-bg-alt)] p-5 sm:p-6">
      <h2 className="type-sub text-[var(--color-text)]">Resumen del pedido</h2>

      <FreeShippingProgress subtotal={subtotal} />

      <dl className="space-y-2 text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-[var(--color-text)]">{formatPrice(subtotal)}</dd>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="flex items-center gap-1 text-[var(--color-text)]">
              Cupón {couponCode}
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="-my-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
                aria-label={`Quitar el cupón ${couponCode}`}
              >
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </dt>
            <dd className="font-semibold tabular-nums text-[var(--color-text)]">−{formatPrice(couponDiscount)}</dd>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-text-muted)]">Envío</dt>
          <dd className="text-right text-[var(--color-text)]">
            {isFreeShipping ? <span className="font-semibold">Gratis</span> : 'Se calcula al ingresar tu ciudad'}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-3">
          <dt className="font-bold text-[var(--color-text)]">{isFreeShipping ? 'Total' : 'Total sin envío'}</dt>
          <dd className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
            {formatPrice(Math.max(0, total))}
          </dd>
        </div>
      </dl>

      {!couponCode && (
        <form onSubmit={handleApplyCoupon} noValidate>
          <label htmlFor="coupon-code" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            ¿Tienes un cupón?
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                if (couponError) setCouponError('');
              }}
              aria-invalid={couponError ? true : undefined}
              aria-describedby={couponError ? 'coupon-error' : undefined}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="submit"
              disabled={couponLoading || !inputCode.trim()}
              className="min-h-11 rounded-full bg-[var(--color-bg-card)] px-5 text-base font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {couponLoading ? 'Validando…' : 'Aplicar'}
            </button>
          </div>
          {couponError && (
            <p id="coupon-error" role="alert" className="mt-2 text-sm text-[var(--color-error)]">
              {couponError}
            </p>
          )}
        </form>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCheckout}
          className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Continuar con la compra
        </button>
        <PaymentReassurance />
      </div>
    </div>
  );
}
