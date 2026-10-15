'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleSignInEnabled } from '@/lib/google';

const inputClassName =
  'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export function LoginContent() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get('next') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password, remember });
      router.push(redirectTo);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesion. Verifica tus credenciales.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (accessToken: string) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(accessToken);
      router.push(redirectTo);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesion con Google.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-center mb-6">Iniciar Sesion</h1>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contrasena"
              className={inputClassName}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
              />
              <label htmlFor="remember" className="text-sm text-[var(--color-text-muted)]">
                Recordarme
              </label>
            </div>
            <Link href="/recuperar-contrasena" className="text-sm text-[var(--color-primary)] hover:underline">
              ¿Olvidaste tu contrasena?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>

        {googleSignInEnabled && (
          <GoogleSignInButton onToken={handleGoogleToken} onError={setError} disabled={loading} />
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
