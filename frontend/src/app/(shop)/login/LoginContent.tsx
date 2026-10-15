'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleSignInEnabled } from '@/lib/google';

const inputClassName =
  'min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]';

export function LoginContent() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = searchParams.get('next');
  // Only same-site paths: an absolute URL here would be an open redirect.
  const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const isCheckout = redirectTo.startsWith('/checkout');

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
        err instanceof Error ? err.message : 'No pudimos iniciar sesión. Revisa tu correo y contraseña e intenta de nuevo.';
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
        err instanceof Error ? err.message : 'No pudimos iniciar sesión con Google. Intenta de nuevo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8">
        <h1 className="type-page text-[clamp(2.25rem,4vw,2.75rem)] text-[var(--color-text)]">
          {isCheckout ? 'Inicia sesión para finalizar tu compra' : 'Iniciar sesión'}
        </h1>
        <p className="mt-3 mb-6 text-base text-[var(--color-text-muted)]">
          {isCheckout
            ? 'Tu carrito se mantiene: al ingresar sigues directo al pago.'
            : 'Ingresa para ver tus pedidos y comprar más rápido.'}
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-[var(--color-error)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-error)]">
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
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                className="h-5 w-5 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
              />
              <label htmlFor="remember" className="text-sm text-[var(--color-text-muted)]">
                Recordarme
              </label>
            </div>
            <Link href="/recuperar-contrasena" className="flex min-h-11 items-center text-sm font-medium text-[var(--color-primary-text)] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : isCheckout ? 'Ingresar y continuar' : 'Iniciar sesión'}
          </button>
        </form>

        {googleSignInEnabled && (
          <GoogleSignInButton onToken={handleGoogleToken} onError={setError} disabled={loading} />
        )}

        <p className="mt-6 text-center text-base text-[var(--color-text-muted)]">
          ¿No tienes cuenta?{' '}
          <Link
            href={redirectTo === '/' ? '/registro' : `/registro?next=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-[var(--color-primary-text)] hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
