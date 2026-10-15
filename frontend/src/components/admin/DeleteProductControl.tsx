'use client';

import { useEffect, useRef, useState } from 'react';
import { adminDeleteProduct } from '@/lib/api';
import { cn } from '@/lib/utils';
import { pillClass as pill, secondaryButtonClass } from './productUi';

/** Inline two-step delete: the first click asks, the second one deletes. */
export function DeleteProductControl({
  productId,
  label = 'Eliminar',
  variant = 'outline',
  onDeleted,
  onError,
  className,
}: {
  productId: string;
  label?: string;
  /** `quiet` is a text button for dense rows; `outline` stands on its own. */
  variant?: 'outline' | 'quiet';
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
          variant === 'quiet'
            ? 'px-3 text-[var(--color-error)] hover:bg-[var(--color-error)]/10'
            : 'border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)]/10',
          className
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div role="group" aria-label="Confirmar eliminación" className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      <span className="text-sm font-semibold text-[var(--color-text)]">¿Eliminar?</span>
      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className={cn(pill, 'px-4 bg-[var(--color-error)] text-white hover:opacity-90 dark:text-[#1A1A2E]')}
      >
        {busy ? 'Eliminando…' : 'Sí, eliminar'}
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className={cn(secondaryButtonClass, 'px-4')}
      >
        Cancelar
      </button>
    </div>
  );
}
