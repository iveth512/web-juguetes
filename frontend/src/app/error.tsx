'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-heading text-4xl font-bold text-[var(--color-text)] mb-4">
          Algo salio mal
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Ocurrio un error inesperado. Intenta nuevamente o vuelve al inicio.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:border-[var(--color-primary)] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
