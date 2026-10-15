'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authRequestPasswordReset } from '@/lib/api';

const inputClassName =
  'min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authRequestPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error && !err.message.includes('API error')
        ? err.message
        : 'No pudimos procesar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8">
        <h1 className="type-page text-[clamp(2.25rem,4vw,2.75rem)] text-[var(--color-text)]">
          Recuperar contraseña
        </h1>

        {sent ? (
          <div className="mt-4 space-y-6">
            <p className="text-base leading-relaxed text-[var(--color-text)]" role="status">
              Si existe una cuenta con <strong className="break-all">{email}</strong>, te enviamos un
              correo con un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center text-base font-semibold text-[var(--color-primary-text)] hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 mb-6 text-base text-[var(--color-text-muted)]">
              Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.
            </p>
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-[var(--color-error)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-error)]"
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
            <p className="mt-6 text-center text-base">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary-text)] hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
