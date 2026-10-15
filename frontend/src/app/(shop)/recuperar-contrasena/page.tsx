'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authRequestPasswordReset } from '@/lib/api';

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

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
        : 'No pudimos procesar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-center mb-2">Recuperar contrasena</h1>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Si existe una cuenta con <strong>{email}</strong>, te enviamos un correo con un enlace
              para crear una nueva contrasena. Revisa tambien tu carpeta de spam.
            </p>
            <Link href="/login" className="inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline">
              Volver a iniciar sesion
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-center text-[var(--color-text-muted)] mb-6">
              Escribe el correo de tu cuenta y te enviaremos un enlace para restablecerla.
            </p>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Correo electronico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              <Link href="/login" className="text-[var(--color-primary)] hover:underline">
                Volver a iniciar sesion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
