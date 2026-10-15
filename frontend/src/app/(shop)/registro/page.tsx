'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleSignInEnabled } from '@/lib/google';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';

const inputClassName =
  'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

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
        err instanceof Error ? err.message : 'Error al crear la cuenta. Intenta de nuevo.';
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
        err instanceof Error ? err.message : 'Error al registrarse con Google.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-center mb-6">Crear Cuenta</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields - 2 column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                className={inputClassName}
              />
            </div>
          </div>

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
              placeholder="Crea una contrasena"
              className={inputClassName}
            />
            <PasswordRequirements password={password} />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Confirmar contrasena
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contrasena"
              className={inputClassName}
            />
            {passwordConfirm && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Las contrasenas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {googleSignInEnabled && (
          <GoogleSignInButton onToken={handleGoogleToken} onError={setError} disabled={loading} />
        )}

        {/* Link to login */}
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
