'use client';

import { useEffect, useRef, useState } from 'react';
import { adminDeleteProduct } from '@/lib/api';
import { cn } from '@/lib/utils';
import { adminPillClass as pill, adminSecondaryButtonClass } from './AdminShell';

/** Inline two-step delete: the first click asks, the second one deletes. */
export function DeleteProductControl({
  productId,
  label = 'Eliminar',
  onDeleted,
  onError,
  className,
}: {
  productId: string;
  label?: string;
  onDeleted: (deactivated: boolean) => void;
  onError: (message: string) => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Keep keyboard focus on the control as it switches between its two steps.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await adminDeleteProduct(productId);
      setConfirming(false);
      onDeleted(Boolean(result?.deactivated));
    } catch (err: unknown) {
      onError(err instanceof Error && !err.message.startsWith('API error')
        ? err.message
        : 'No se pudo eliminar el producto.');
    } finally {
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(
          pill,
          'border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)]/10',
          className
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div role="group" aria-label="Confirmar eliminación" className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm font-semibold text-[var(--color-text)]">¿Eliminar?</span>
      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className={cn(pill, 'bg-[var(--color-error)] text-[var(--color-bg)] hover:opacity-90')}
      >
        {busy ? 'Eliminando…' : 'Sí, eliminar'}
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className={adminSecondaryButtonClass}
      >
        Cancelar
      </button>
    </div>
  );
}
