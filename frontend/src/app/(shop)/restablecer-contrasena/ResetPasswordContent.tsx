'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authConfirmPasswordReset } from '@/lib/api';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';

const inputClassName =
  'min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password1 !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authConfirmPasswordReset({ uid, token, new_password1: password1, new_password2: password2 });
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(
        !message || message.includes('API error') || message.toLowerCase().includes('invalid')
          ? 'El enlace no es válido o ya expiró. Solicita uno nuevo.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <p className="text-base text-[var(--color-text)]">
        El enlace está incompleto.{' '}
        <Link href="/recuperar-contrasena" className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4">
          Solicita uno nuevo
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <p className="text-base text-[var(--color-text)]" role="status">
          Listo, tu contraseña quedó actualizada. Ya puedes iniciar sesión con ella.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
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
          <label htmlFor="password1" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Nueva contraseña
          </label>
          <input
            id="password1"
            type="password"
            required
            autoComplete="new-password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            className={inputClassName}
          />
          <PasswordRequirements password={password1} />
        </div>
        <div>
          <label htmlFor="password2" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Confirmar contraseña
          </label>
          <input
            id="password2"
            type="password"
            required
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className={inputClassName}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </>
  );
}
