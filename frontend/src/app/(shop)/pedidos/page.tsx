'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--color-bg-alt)] rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-bg-alt)] rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text)]">Mis Pedidos</span>
      </nav>

      <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-8">
        Mis Pedidos
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--color-text-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h2 className="font-heading text-xl font-bold text-[var(--color-text)] mb-2">
            No tienes pedidos aun
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Explora nuestro catalogo y encuentra tus coleccionables favoritos.
          </p>
          <Link
            href="/productos"
            className="inline-block px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const statusColor = ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800';
            const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

            return (
              <Link
                key={order.id}
                href={`/pedido-confirmado/${order.id}`}
                className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-heading font-bold text-[var(--color-text)]">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {formattedDate} &middot; {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.items.slice(0, 3).map((item) => (
                        <span key={item.id} className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-alt)] px-2 py-0.5 rounded">
                          {item.product_name}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-alt)] px-2 py-0.5 rounded">
                          +{order.items.length - 3} mas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-lg font-extrabold text-[var(--color-primary)]">
                      {formatPrice(order.total)}
                    </span>
                    {order.status === 'pending' && (
                      <p className="text-xs font-semibold text-[var(--color-primary)] mt-1">Pagar ahora &rarr;</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
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
