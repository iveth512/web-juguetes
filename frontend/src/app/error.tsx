'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:py-24">
      <div className="max-w-[56ch]">
        <h1 className="type-page text-[var(--color-text)]">Algo se nos cayó de la repisa</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]">
          No pudimos cargar esta página. Vuelve a intentarlo; si el problema sigue, tu carrito
          está a salvo y puedes seguir comprando desde el catálogo.
        </p>
        {error.digest && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Código de referencia: <span className="tabular-nums">{error.digest}</span>
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-base font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/productos"
            className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-bg-alt)] text-base font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            Ver catálogo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-11 text-base font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
