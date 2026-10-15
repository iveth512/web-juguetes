'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleSignInEnabled } from '@/lib/google';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';

const inputClassName =
  'min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export default function RegisterPage() {
  const { register, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === passwordConfirm;
  const allFieldsFilled = firstName && lastName && email && password && passwordConfirm;
  const canSubmit = allFieldsFilled && passwordsMatch && isPasswordValid(password);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password1: password,
        password2: passwordConfirm,
        first_name: firstName,
        last_name: lastName,
      });
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'No pudimos crear la cuenta. Inténtalo de nuevo.';
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
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'No pudimos registrarte con Google. Inténtalo de nuevo.';
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
          Crear cuenta
        </h1>
        <p className="mt-3 mb-6 text-base text-[var(--color-text-muted)]">
          Guarda tus favoritos, sigue tus pedidos y compra más rápido.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
            <PasswordRequirements password={password} />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              aria-invalid={Boolean(passwordConfirm) && !passwordsMatch}
              className={inputClassName}
            />
            {passwordConfirm && !passwordsMatch && (
              <p className="mt-1 text-sm text-[var(--color-error)]">Las contraseñas no coinciden.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        {googleSignInEnabled && (
          <GoogleSignInButton onToken={handleGoogleToken} onError={setError} disabled={loading} />
        )}

        <p className="mt-6 text-center text-base text-[var(--color-text-muted)]">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-[var(--color-primary-text)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
