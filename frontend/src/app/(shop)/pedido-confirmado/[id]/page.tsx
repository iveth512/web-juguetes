'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircleCheck, CircleX, Clock } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cancelOrder, getOrderDetail, syncOrderPayment } from '@/lib/api';
import { payOrder } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import type { OrderResponse } from '@/types/product';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15; // ~1 minute

function StatusIcon({ tone }: { tone: 'done' | 'waiting' | 'stopped' }) {
  const Icon = { done: CircleCheck, waiting: Clock, stopped: CircleX }[tone];
  const color = {
    done: 'text-[var(--color-accent)]',
    waiting: 'text-[var(--color-primary)]',
    stopped: 'text-[var(--color-error)]',
  }[tone];
  return (
    <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-alt)]">
      <Icon className={`h-10 w-10 ${color}`} strokeWidth={1.75} aria-hidden="true" />
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
    initError ? 'No pudimos abrir la pasarela de pago. Tu pedido está reservado: intenta pagar de nuevo.' : ''
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
      .catch(() => setError('No pudimos cargar el pedido. Revisa tu conexión y recarga la página.'))
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
      setActionError(err instanceof Error ? err.message : 'No pudimos abrir la pasarela de pago. Intenta de nuevo en un momento.');
      refresh().catch(() => undefined);
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar este pedido? Los productos se liberarán.')) return;
    setActionError('');
    try {
      setOrder(await cancelOrder(id));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'No pudimos cancelar el pedido. Intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 bg-[var(--color-bg-alt)] rounded-full mx-auto" />
          <div className="h-12 w-72 bg-[var(--color-bg-alt)] rounded-lg mx-auto" />
          <div className="h-48 bg-[var(--color-bg-alt)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="mb-6 text-base text-[var(--color-error)]">{error || 'Pedido no encontrado.'}</p>
        <Link
          href="/productos"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
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
            <StatusIcon tone="done" />
            <h1 className="type-page mb-3 text-[var(--color-text)]">
              {paidTitle}
            </h1>
            <p className="mb-1 text-base text-[var(--color-text-muted)]">
              Te enviamos la confirmación a tu correo.
            </p>
          </>
        ) : isPending && confirming ? (
          <>
            <StatusIcon tone="waiting" />
            <h1 className="type-page mb-3 text-[var(--color-text)]">
              Confirmando tu pago…
            </h1>
            <p className="mb-1 text-base text-[var(--color-text)]">
              Esto puede tardar unos segundos. No cierres esta página.
            </p>
          </>
        ) : isPending ? (
          <>
            <StatusIcon tone="waiting" />
            <h1 className="type-page mb-3 text-[var(--color-text)]">
              Pago pendiente
            </h1>
            <p className="mb-1 text-base text-[var(--color-text)]">
              {boldStatus
                ? 'Aún no recibimos la confirmación del pago. Si pagaste por PSE puede tardar unos minutos; te avisaremos por correo.'
                : 'Tu pedido está reservado, pero aún no se ha pagado.'}
            </p>
            {order.expires_at && (
              <p className="mb-1 text-sm text-[var(--color-text-muted)]">
                La reserva vence a las{' '}
                {new Date(order.expires_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        ) : (
          <>
            <StatusIcon tone="stopped" />
            <h1 className="type-page mb-3 text-[var(--color-text)]">
              {order.status === 'refunded' ? 'Pago reembolsado' : 'Pedido cancelado'}
            </h1>
            <p className="mb-1 text-base text-[var(--color-text-muted)]">
              {order.status === 'refunded'
                ? 'El pago de este pedido fue anulado.'
                : 'Este pedido no se pagó a tiempo o fue cancelado. Puedes volver a armar tu carrito.'}
            </p>
          </>
        )}
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </p>

        {actionError && (
          <div role="alert" className="mx-auto mt-4 max-w-xl rounded-xl border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)]">
            {actionError}
          </div>
        )}

        {isPending && !confirming && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? 'Abriendo pasarela…' : 'Pagar ahora'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-bg-alt)] px-6 text-base font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
            >
              Cancelar pedido
            </button>
          </div>
        )}
      </div>

      {/* Order details card */}
      <div className="mb-6 rounded-2xl bg-[var(--color-bg-alt)] p-5 sm:p-6">
        <h2 className="type-sub mb-4 text-[var(--color-text)]">
          Detalle del pedido
        </h2>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-base">
              <div className="flex-1 min-w-0">
                <p className="text-[var(--color-text)]">{item.product_name}</p>
                {item.variant_name && (
                  <p className="text-sm text-[var(--color-text-muted)]">{item.variant_name}</p>
                )}
                <p className="text-sm text-[var(--color-text-muted)]">{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-[var(--color-text)]">
                {formatPrice(parseFloat(item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>


        {/* Totals */}
        <div className="space-y-2 text-base">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Subtotal</span>
            <span className="font-semibold text-[var(--color-text)]">{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text)]">Descuento{order.coupon ? ` (${order.coupon})` : ''}</span>
              <span className="font-semibold tabular-nums text-[var(--color-text)]">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Envío</span>
            {parseFloat(order.shipping_cost) === 0 ? (
              <span className="font-semibold text-[var(--color-text)]">Gratis</span>
            ) : (
              <span className="font-semibold text-[var(--color-text)]">{formatPrice(order.shipping_cost)}</span>
            )}
          </div>
        </div>


        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-base font-bold text-[var(--color-text)]">Total</span>
          <span className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Shipping info */}
      <div className="mb-10 rounded-2xl bg-[var(--color-bg-alt)] p-5 sm:p-6">
        <h2 className="type-sub mb-3 text-[var(--color-text)]">
          Dirección de envío
        </h2>
        <p className="text-base text-[var(--color-text)]">{order.shipping_name}</p>
        <p className="text-base text-[var(--color-text-muted)]">
          {order.shipping_address && <>{order.shipping_address}, </>}
          {order.shipping_city}, {order.shipping_department}
        </p>
        {order.tracking_number && (
          <p className="mt-2 text-base text-[var(--color-text)]">
            Guía{order.shipping_carrier ? ` ${order.shipping_carrier}` : ''}:{' '}
            <span className="font-semibold">{order.tracking_number}</span>
          </p>
        )}
        {order.notes && (
          <p className="mt-2 text-base text-[var(--color-text-muted)]">
            Notas: {order.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/pedidos"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/productos"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-bg-alt)] px-6 text-base font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
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
