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
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No encontramos este intento de pago. Revisa tus pedidos para pagar de nuevo.'));
  }, [referencia]);

  const resolve = async (resultado: 'aprobado' | 'rechazado') => {
    setBusy(resultado);
    setError('');
    try {
      const res = await resolveSimulatedCharge(referencia, resultado);
      router.replace(`/pedido-confirmado/${res.order_id}?estado-pago=${resultado === 'aprobado' ? 'approved' : 'rejected'}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No pudimos procesar el pago simulado. Intenta de nuevo.');
      setBusy(null);
    }
  };

  if (error && !charge) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-6 text-base text-[var(--color-error)]">{error}</p>
        <Link href="/pedidos" className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]">Ver mis pedidos</Link>
      </div>
    );
  }
  if (!charge) {
    return <div className="mx-auto my-16 h-96 max-w-md animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />;
  }

  const processed = charge.status !== 'pending';

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-4 rounded-xl bg-[var(--color-bg-alt)] px-4 py-3 text-sm text-[var(--color-text)]" role="note">
        <strong>Pasarela de pago simulada.</strong> Entorno local de demostración: no se realiza ningún cobro.
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-alt)]">
        <div className="bg-[var(--color-stage)] px-6 py-5 text-[var(--color-stage-text)]">
          <p className="text-sm text-[var(--color-stage-muted)]">Pago a Juguetes para Frikis</p>
          <p className="mt-3 text-sm text-[var(--color-stage-muted)]">{charge.description}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatPrice(charge.amount)} <span className="text-base font-semibold text-[var(--color-stage-muted)]">{charge.currency}</span>
          </p>
        </div>

        <div className="space-y-5 p-6">
          <ul className="space-y-2 text-base">
            {charge.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 text-[var(--color-text)]">
                <span className="min-w-0">{item.cantidad} × {item.nombre}{item.variante ? ` (${item.variante})` : ''}</span>
                <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">{formatPrice(Number(item.precio) * item.cantidad)}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-muted)]">
            <p className="font-semibold text-[var(--color-text)]">Tarjeta de prueba</p>
            <p className="mt-1 font-mono">4111 1111 1111 1111 · 12/30 · 123</p>
            <p className="mt-1 text-sm">Elige el resultado que quieres simular.</p>
          </div>

          {error && <p className="rounded-xl border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)]" role="alert">{error}</p>}

          {processed ? (
            <div className="text-center text-base text-[var(--color-text-muted)]">
              <p className="mb-3">Este intento de pago ya fue {charge.status === 'approved' ? 'aprobado' : 'procesado'}.</p>
              <Link href={`/pedido-confirmado/${charge.order_id}`} className="font-semibold text-[var(--color-primary-text)] hover:underline">
                Ver el pedido
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => resolve('aprobado')}
                disabled={busy !== null}
                className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'aprobado' ? 'Procesando…' : `Aprobar pago de ${formatPrice(charge.amount)}`}
              </button>
              <button
                type="button"
                onClick={() => resolve('rechazado')}
                disabled={busy !== null}
                className="min-h-12 w-full rounded-full bg-[var(--color-bg-card)] px-6 text-base font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'rechazado' ? 'Procesando…' : 'Rechazar pago'}
              </button>
              <Link
                href={`/pedido-confirmado/${charge.order_id}`}
                className="flex min-h-11 items-center justify-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
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
