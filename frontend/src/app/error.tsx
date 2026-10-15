'use client';

import Link from 'next/link';
import { Sticker } from '@/components/ui/Sticker';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:py-24">
      <div className="grain relative max-w-3xl rounded-2xl bg-[var(--color-showcase)] px-6 pb-10 pt-14 text-[var(--color-showcase-text)] md:px-12">
        <Sticker tone="orange" tilt={-7} className="absolute -top-4 -left-2 z-10 text-xl md:text-2xl">
          ¡Tirada crítica fallida!
        </Sticker>
        <h1 className="type-page">Algo se nos cayó de la repisa</h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed">
          No pudimos cargar esta página. Vuelve a intentarlo; si el problema sigue, tu carrito
          está a salvo y puedes seguir comprando desde el catálogo.
        </p>
        {error.digest && (
          <p className="mt-3 text-sm text-[var(--color-showcase-muted)]">
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
            className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-showcase-raised)] text-base font-semibold text-[var(--color-showcase-text)] hover:opacity-85 transition-opacity"
          >
            Ver catálogo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-11 text-base font-semibold text-[var(--color-showcase-text)] underline underline-offset-4"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
