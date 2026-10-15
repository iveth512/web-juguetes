'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Package } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderResponse } from '@/types/product';

function OrdersList() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError('No se pudieron cargar los pedidos.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 bg-[var(--color-bg-alt)] rounded" />
          <div className="h-16 w-72 max-w-full bg-[var(--color-bg-alt)] rounded mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-bg-alt)] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
          Inicio
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <Link href="/cuenta" className="hover:text-[var(--color-primary-text)] transition-colors">
          Mi cuenta
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          Mis pedidos
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-12">
        <h1 className="type-page text-[var(--color-text)]">Mis pedidos</h1>
        {orders.length > 0 && (
          <p className="mt-3 text-base text-[var(--color-text-muted)] tabular-nums">
            {orders.length === 1 ? '1 pedido' : `${orders.length} pedidos`}
          </p>
        )}
      </header>

      {error ? (
        <div className="flex flex-col items-start max-w-[52ch]">
          <AlertCircle strokeWidth={1.75} className="w-8 h-8 text-[var(--color-error)] mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">{error}</h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            Recarga la página en un momento. Si el problema sigue, escríbenos desde{' '}
            <Link
              href="/contacto"
              className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
            >
              Contacto
            </Link>
            .
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-start max-w-[52ch]">
          <Package strokeWidth={1.75} className="w-8 h-8 text-[var(--color-text-muted)] mb-4" />
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
            Aún no tienes pedidos
          </h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)] mb-6">
            Cuando compres, aquí verás el estado de cada pedido y su total.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const formattedDate = new Date(order.created_at).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const statusColor = ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800';
            const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
            const names = order.items.slice(0, 3).map((item) => item.product_name);
            const extra = order.items.length - names.length;

            return (
              <li key={order.id}>
                <Link
                  href={`/pedido-confirmado/${order.id}`}
                  className="group flex flex-col gap-4 rounded-2xl bg-[var(--color-bg-alt)] p-5 md:p-6 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--color-border)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-lg font-semibold text-[var(--color-text)] tabular-nums">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-sm font-semibold leading-none ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {formattedDate}, {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </p>
                    <p className="mt-2 text-base text-[var(--color-text)] line-clamp-2">
                      {names.join(', ')}
                      {extra > 0 && ` y ${extra} más`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                    <span className="text-xl font-semibold text-[var(--color-text)] tabular-nums">
                      {formatPrice(order.total)}
                    </span>
                    {order.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary-text)]">
                        Completar pago
                        <ChevronRight strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                        Ver detalle
                        <ChevronRight strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersList />
    </ProtectedRoute>
  );
}
