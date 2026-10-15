'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authConfirmPasswordReset } from '@/lib/api';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

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
      setError('Las contrasenas no coinciden.');
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
          ? 'El enlace no es valido o ya expiro. Solicita uno nuevo.'
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <p className="text-sm text-center text-[var(--color-text-muted)]">
        El enlace esta incompleto.{' '}
        <Link href="/recuperar-contrasena" className="text-[var(--color-primary)] hover:underline">
          Solicita uno nuevo
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">Tu contrasena fue actualizada.</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          Iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password1" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Nueva contrasena
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
            Confirmar contrasena
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
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar contrasena'}
        </button>
      </form>
    </>
  );
}
