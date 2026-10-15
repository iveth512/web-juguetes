'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getSimulatedCharge, resolveSimulatedCharge, type SimulatedCharge } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

/**
 * Local-only test gateway. It stands in for the real payment page so the
 * whole purchase can be tried without accounts or real money; the result
 * goes through the same notification processing as the real gateway.
 */
function SimulatedGateway() {
  const { referencia } = useParams<{ referencia: string }>();
  const router = useRouter();
  const [charge, setCharge] = useState<SimulatedCharge | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'aprobado' | 'rechazado' | null>(null);

  useEffect(() => {
    getSimulatedCharge(referencia)
      .then(setCharge)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No se encontro el pago.'));
  }, [referencia]);

  const resolve = async (resultado: 'aprobado' | 'rechazado') => {
    setBusy(resultado);
    setError('');
    try {
      const res = await resolveSimulatedCharge(referencia, resultado);
      router.replace(`/pedido-confirmado/${res.order_id}?estado-pago=${resultado === 'aprobado' ? 'approved' : 'rejected'}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el pago.');
      setBusy(null);
    }
  };

  if (error && !charge) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <Link href="/pedidos" className="font-semibold text-[var(--color-primary)] hover:underline">Ver mis pedidos</Link>
      </div>
    );
  }
  if (!charge) {
    return <div className="mx-auto my-16 h-96 max-w-md animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />;
  }

  const processed = charge.status !== 'pending';

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900" role="note">
        <strong>Pasarela de pago simulada.</strong> Entorno local de demostracion: no se realiza ningun cobro.
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm">
        <div className="bg-[var(--color-secondary-dark)] px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-wide opacity-80">Pagando a</p>
          <p className="text-lg font-bold">Juguetes para Frikis</p>
          <p className="mt-3 text-sm opacity-90">{charge.description}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">
            {formatPrice(charge.amount)} <span className="text-base font-semibold opacity-80">{charge.currency}</span>
          </p>
        </div>

        <div className="space-y-5 p-6">
          <ul className="space-y-1 text-sm">
            {charge.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 text-[var(--color-text)]">
                <span className="truncate">{item.cantidad}× {item.nombre}{item.variante ? ` (${item.variante})` : ''}</span>
                <span className="tabular-nums text-[var(--color-text-muted)]">{formatPrice(Number(item.precio) * item.cantidad)}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            <p className="font-semibold text-[var(--color-text)]">Tarjeta de prueba</p>
            <p className="mt-1 font-mono">4111 1111 1111 1111 · 12/30 · 123</p>
            <p className="mt-1 text-xs">Elige el resultado que quieres simular.</p>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

          {processed ? (
            <div className="text-center text-sm text-[var(--color-text-muted)]">
              <p className="mb-3">Este intento de pago ya fue {charge.status === 'approved' ? 'aprobado' : 'procesado'}.</p>
              <Link href={`/pedido-confirmado/${charge.order_id}`} className="font-semibold text-[var(--color-primary)] hover:underline">
                Ver el pedido
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => resolve('aprobado')}
                disabled={busy !== null}
                className="w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {busy === 'aprobado' ? 'Procesando...' : `Aprobar pago de ${formatPrice(charge.amount)}`}
              </button>
              <button
                type="button"
                onClick={() => resolve('rechazado')}
                disabled={busy !== null}
                className="w-full rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {busy === 'rechazado' ? 'Procesando...' : 'Rechazar pago'}
              </button>
              <Link
                href={`/pedido-confirmado/${charge.order_id}`}
                className="block text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                Volver a la tienda sin pagar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimulatedGatewayPage() {
  return (
    <ProtectedRoute>
      <SimulatedGateway />
    </ProtectedRoute>
  );
}
