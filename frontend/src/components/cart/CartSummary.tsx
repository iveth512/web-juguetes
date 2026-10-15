'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { validateCoupon } from '@/lib/api';

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

  const handleApplyCoupon = async () => {
    if (!inputCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const result = await validateCoupon(inputCode.trim(), subtotal);
      applyCoupon(result.code, parseFloat(result.discount_amount));
      setInputCode('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cupon no valido';
      // Try to extract detail from API error
      setCouponError(message.includes('API error') ? 'Cupon no valido' : message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?next=/checkout');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-5 sticky top-[100px] lg:top-[180px]">
      <h2 className="font-heading text-lg font-bold text-[var(--color-text)] mb-4">
        Resumen del pedido
      </h2>

      {/* Subtotal */}
      <div className="flex justify-between text-sm mb-2">
        <span className="text-[var(--color-text-muted)]">Subtotal</span>
        <span className="font-semibold text-[var(--color-text)]">{formatPrice(subtotal)}</span>
      </div>

      {/* Coupon discount */}
      {couponDiscount > 0 && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 flex items-center gap-1">
            Cupon ({couponCode})
            <button
              onClick={handleRemoveCoupon}
              className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
              aria-label="Quitar cupon"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
          <span className="font-semibold text-green-600">-{formatPrice(couponDiscount)}</span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-[var(--color-text-muted)]">Envio</span>
        {isFreeShipping ? (
          <span className="font-semibold text-green-600">Gratis!</span>
        ) : (
          <span className="text-[var(--color-text-muted)]">Se calcula en el checkout</span>
        )}
      </div>

      <hr className="border-[var(--color-border)] mb-4" />

      {/* Total */}
      <div className="flex justify-between mb-6">
        <span className="text-base font-bold text-[var(--color-text)]">{isFreeShipping ? "Total" : "Total sin envio"}</span>
        <span className="font-heading text-xl font-extrabold text-[var(--color-primary)]">
          {formatPrice(Math.max(0, total))}
        </span>
      </div>

      {/* Coupon input */}
      {!couponCode && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Codigo de cupon"
              className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !inputCode.trim()}
              className="px-4 py-2 text-sm font-semibold border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-alt)] transition-colors text-[var(--color-text)] disabled:opacity-50"
            >
              {couponLoading ? '...' : 'Aplicar'}
            </button>
          </div>
          {couponError && (
            <p className="text-xs text-red-500 mt-1">{couponError}</p>
          )}
        </div>
      )}

      {/* Checkout button */}
      <button
        onClick={handleCheckout}
        className="w-full py-3.5 rounded-lg text-base font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Proceder al Pago
      </button>
    </div>
  );
}
