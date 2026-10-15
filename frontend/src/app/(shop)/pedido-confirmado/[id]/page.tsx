'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cancelOrder, getOrderDetail, syncOrderPayment } from '@/lib/api';
import { payOrder } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import type { OrderResponse } from '@/types/product';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15; // ~1 minute

function StatusIcon({ tone }: { tone: 'green' | 'yellow' | 'red' }) {
  const bg = { green: 'bg-green-100', yellow: 'bg-yellow-100', red: 'bg-red-100' }[tone];
  const fg = { green: 'text-green-600', yellow: 'text-yellow-600', red: 'text-red-600' }[tone];
  return (
    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${bg} mb-4`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${fg}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {tone === 'green' && <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />}
        {tone === 'yellow' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </>
        )}
        {tone === 'red' && <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
      </svg>
    </div>
  );
}

function OrderConfirmation() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  // The gateway appends its result on redirect (Bold: bold-tx-status, local
  // simulated gateway: estado-pago). Only a hint: the backend confirms.
  const boldStatus = searchParams.get('bold-tx-status') ?? searchParams.get('estado-pago');
  const initError = searchParams.get('error') === 'payment_init';

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState(
    initError ? 'No pudimos abrir la pasarela de pago. Tu pedido esta reservado: intenta pagar de nuevo.' : ''
  );
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(Boolean(boldStatus));
  const polls = useRef(0);

  const refresh = useCallback(async () => {
    // sync asks Bold for the real status in case the webhook has not arrived yet
    const fresh = await syncOrderPayment(id).catch(() => getOrderDetail(id));
    setOrder(fresh);
    return fresh;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    refresh()
      .catch(() => setError('No se pudo cargar el pedido.'))
      .finally(() => setLoading(false));
  }, [id, refresh]);

  // Coming back from Bold: poll while the payment is still being confirmed.
  useEffect(() => {
    if (!confirming || !order) return;
    if (order.status !== 'pending' || polls.current >= MAX_POLLS) {
      setConfirming(false);
      return;
    }
    const timer = setTimeout(() => {
      polls.current += 1;
      refresh().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [confirming, order, refresh]);

  const handlePay = async () => {
    setPaying(true);
    setActionError('');
    try {
      await payOrder(id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'No se pudo iniciar el pago.');
      refresh().catch(() => undefined);
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar este pedido? Los productos se liberaran.')) return;
    setActionError('');
    try {
      setOrder(await cancelOrder(id));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cancelar el pedido.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 bg-[var(--color-bg-alt)] rounded-full mx-auto" />
          <div className="h-8 w-64 bg-[var(--color-bg-alt)] rounded mx-auto" />
          <div className="h-48 bg-[var(--color-bg-alt)] rounded" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-500 mb-4">{error || 'Pedido no encontrado.'}</p>
        <Link
          href="/productos"
          className="inline-block px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ir a productos
        </Link>
      </div>
    );
  }

  const isPaid = ['paid', 'shipped', 'delivered'].includes(order.status);
  const isPending = order.status === 'pending';

  let paidTitle = '¡Pago aprobado!';
  if (order.status === 'shipped') paidTitle = '¡Tu pedido va en camino!';
  if (order.status === 'delivered') paidTitle = '¡Pedido entregado!';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Status */}
      <div className="text-center mb-8">
        {isPaid ? (
          <>
            <StatusIcon tone="green" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
              {paidTitle}
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-1">
              Te enviamos la confirmacion a tu correo.
            </p>
          </>
        ) : isPending && confirming ? (
          <>
            <StatusIcon tone="yellow" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
              Confirmando tu pago...
            </h1>
            <p className="text-yellow-600 text-sm mb-1">
              Esto puede tardar unos segundos. No cierres esta pagina.
            </p>
          </>
        ) : isPending ? (
          <>
            <StatusIcon tone="yellow" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
              Pago pendiente
            </h1>
            <p className="text-yellow-600 text-sm mb-1">
              {boldStatus
                ? 'Aun no recibimos la confirmacion del pago. Si pagaste por PSE puede tardar unos minutos; te avisaremos por correo.'
                : 'Tu pedido esta reservado pero aun no se ha pagado.'}
            </p>
            {order.expires_at && (
              <p className="text-[var(--color-text-muted)] text-xs mb-1">
                La reserva vence a las{' '}
                {new Date(order.expires_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        ) : (
          <>
            <StatusIcon tone="red" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
              {order.status === 'refunded' ? 'Pago reembolsado' : 'Pedido cancelado'}
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-1">
              {order.status === 'refunded'
                ? 'El pago de este pedido fue anulado.'
                : 'Este pedido no se pago a tiempo o fue cancelado. Puedes volver a armar tu carrito.'}
            </p>
          </>
        )}
        <p className="text-[var(--color-text-muted)]">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </p>

        {actionError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {actionError}
          </div>
        )}

        {isPending && !confirming && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
            >
              {paying ? 'Abriendo pasarela...' : 'Pagar ahora'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:bg-[var(--color-bg-alt)] transition-colors"
            >
              Cancelar pedido
            </button>
          </div>
        )}
      </div>

      {/* Order details card */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <h2 className="font-heading text-lg font-bold text-[var(--color-text)] mb-4">
          Detalle del pedido
        </h2>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="text-[var(--color-text)] truncate">{item.product_name}</p>
                {item.variant_name && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{item.variant_name}</p>
                )}
                <p className="text-[var(--color-text-muted)]">x{item.quantity}</p>
              </div>
              <span className="font-semibold text-[var(--color-text)] ml-2">
                {formatPrice(parseFloat(item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-[var(--color-border)] mb-4" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Subtotal</span>
            <span className="font-semibold text-[var(--color-text)]">{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">Descuento{order.coupon ? ` (${order.coupon})` : ''}</span>
              <span className="font-semibold text-green-600">-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Envio</span>
            {parseFloat(order.shipping_cost) === 0 ? (
              <span className="font-semibold text-green-600">Gratis!</span>
            ) : (
              <span className="font-semibold text-[var(--color-text)]">{formatPrice(order.shipping_cost)}</span>
            )}
          </div>
        </div>

        <hr className="border-[var(--color-border)] my-4" />

        <div className="flex justify-between">
          <span className="text-base font-bold text-[var(--color-text)]">Total</span>
          <span className="font-heading text-xl font-extrabold text-[var(--color-primary)]">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Shipping info */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6 mb-8">
        <h2 className="font-heading text-lg font-bold text-[var(--color-text)] mb-3">
          Direccion de envio
        </h2>
        <p className="text-sm text-[var(--color-text)]">{order.shipping_name}</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {order.shipping_address && <>{order.shipping_address}, </>}
          {order.shipping_city}, {order.shipping_department}
        </p>
        {order.tracking_number && (
          <p className="text-sm text-[var(--color-text)] mt-2">
            Guia{order.shipping_carrier ? ` ${order.shipping_carrier}` : ''}:{' '}
            <span className="font-semibold">{order.tracking_number}</span>
          </p>
        )}
        {order.notes && (
          <p className="text-sm text-[var(--color-text-muted)] mt-2 italic">
            Notas: {order.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/pedidos"
          className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-center hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/productos"
          className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-center hover:bg-[var(--color-bg-alt)] transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <ProtectedRoute>
      <OrderConfirmation />
    </ProtectedRoute>
  );
}
