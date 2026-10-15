'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AccountCreatedError, useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleSignInEnabled } from '@/lib/google';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';
import { cn } from '@/lib/utils';

type FieldName = 'firstName' | 'lastName' | 'email' | 'password' | 'passwordConfirm';
type Values = Record<FieldName, string>;
type Status = 'idle' | 'submitting' | 'done';

const FIELD_ORDER: FieldName[] = ['firstName', 'lastName', 'email', 'password', 'passwordConfirm'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WELCOME_REDIRECT_MS = 2500;

function validate(v: Values): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (!v.firstName.trim()) errors.firstName = 'Escribe tu nombre.';
  if (!v.lastName.trim()) errors.lastName = 'Escribe tu apellido.';
  if (!v.email.trim()) errors.email = 'Escribe tu correo electrónico.';
  else if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = 'Revisa el correo: debe verse como nombre@dominio.com.';
  if (!v.password) errors.password = 'Escribe una contraseña.';
  else if (!isPasswordValid(v.password)) errors.password = 'La contraseña aún no cumple los requisitos de abajo.';
  if (!v.passwordConfirm) errors.passwordConfirm = 'Repite la contraseña para confirmarla.';
  else if (v.passwordConfirm !== v.password) errors.passwordConfirm = 'Las contraseñas no coinciden.';
  return errors;
}

const inputBase =
  'min-h-12 w-full rounded-xl border bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export function RegisterContent() {
  const { register, loginWithGoogle, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get('next');
  // Only same-site paths: an absolute URL here would be an open redirect.
  const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const isCheckout = redirectTo.startsWith('/checkout');

  const [values, setValues] = useState<Values>({
    firstName: '', lastName: '', email: '', password: '', passwordConfirm: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  // Errors appear after the first submit and then follow the input live.
  const errors = submitted ? validate(values) : {};
  const confirmMismatch =
    !submitted &&
    values.passwordConfirm.length >= values.password.length &&
    values.passwordConfirm !== '' &&
    values.passwordConfirm !== values.password;
  const confirmError = errors.passwordConfirm ?? (confirmMismatch ? 'Las contraseñas no coinciden.' : undefined);

  const loading = status === 'submitting';
  const loginHref = next ? `/login?next=${encodeURIComponent(redirectTo)}` : '/login';

  useEffect(() => {
    if (isAuthenticated && status === 'idle') router.replace(redirectTo);
  }, [isAuthenticated, status, router, redirectTo]);

  useEffect(() => {
    if (status !== 'done') return;
    const timer = setTimeout(() => router.replace(redirectTo), WELCOME_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [status, router, redirectTo]);

  const setField = (field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);
    const found = validate(values);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setError('');
    setAccountCreated(false);
    setStatus('submitting');
    try {
      await register({
        email: values.email.trim(),
        password1: values.password,
        password2: values.passwordConfirm,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
      });
      setStatus('done');
    } catch (err: unknown) {
      if (err instanceof AccountCreatedError) setAccountCreated(true);
      const message = err instanceof Error ? err.message : '';
      setError(
        !message || message.startsWith('API error')
          ? 'No pudimos crear la cuenta. Revisa tu conexión e inténtalo de nuevo.'
          : message
      );
      setStatus('idle');
    }
  };

  const handleGoogleToken = async (accessToken: string) => {
    setError('');
    setStatus('submitting');
    try {
      await loginWithGoogle(accessToken);
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No pudimos registrarte con Google. Inténtalo de nuevo.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    const name = user?.first_name || values.firstName.trim();
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div role="status" className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8">
          <h1
            ref={(el) => el?.focus()}
            tabIndex={-1}
            className="type-page text-[clamp(2.25rem,4vw,2.75rem)] text-[var(--color-text)] focus:outline-none"
          >
            Tu cuenta está lista
          </h1>
          <p className="mt-3 text-base text-[var(--color-text)]">
            {name ? `Hola, ${name}. ` : ''}Ya iniciaste sesión: tus favoritos y pedidos quedan guardados en tu cuenta.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {isCheckout ? 'Te llevamos a finalizar tu compra en un momento.' : 'Te llevamos a la tienda en un momento.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={redirectTo}
              replace
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {isCheckout ? 'Continuar con tu compra' : 'Seguir comprando'}
            </Link>
            <Link
              href="/cuenta"
              replace
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-bg-card)] px-6 text-base font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
            >
              Ver mi cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && status === 'idle') return null;

  const fieldProps = (field: FieldName, describedBy?: string) => {
    const fieldError = field === 'passwordConfirm' ? confirmError : errors[field];
    const ids = [fieldError ? `${field}-error` : null, describedBy].filter(Boolean).join(' ');
    return {
      id: field,
      name: field,
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(field, e.target.value),
      'aria-required': true,
      'aria-invalid': fieldError ? true : undefined,
      'aria-describedby': ids || undefined,
      className: cn(inputBase, fieldError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'),
    };
  };

  const fieldError = (field: FieldName) => {
    const message = field === 'passwordConfirm' ? confirmError : errors[field];
    return message ? (
      <p id={`${field}-error`} className="mt-1 text-sm text-[var(--color-error)]">
        {message}
      </p>
    ) : null;
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8">
        <h1 className="type-page text-[clamp(2.25rem,4vw,2.75rem)] text-[var(--color-text)]">
          Crear cuenta
        </h1>
        <p className="mt-3 mb-6 text-base text-[var(--color-text-muted)]">
          {isCheckout
            ? 'Crea tu cuenta y sigue directo al pago: tu carrito se mantiene.'
            : 'Guarda tus favoritos, sigue tus pedidos y compra más rápido.'}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[var(--color-error)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-error)]"
          >
            {error}
            {accountCreated && (
              <Link
                href={loginHref}
                className="mt-1 flex min-h-11 items-center font-semibold text-[var(--color-primary-text)] underline"
              >
                Ir a iniciar sesión
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                Nombre
              </label>
              <input type="text" autoComplete="given-name" {...fieldProps('firstName')} />
              {fieldError('firstName')}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                Apellido
              </label>
              <input type="text" autoComplete="family-name" {...fieldProps('lastName')} />
              {fieldError('lastName')}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              Correo electrónico
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="tu@correo.com"
              {...fieldProps('email')}
            />
            {fieldError('email')}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              Contraseña
            </label>
            <input type="password" autoComplete="new-password" {...fieldProps('password', 'password-requirements')} />
            {fieldError('password')}
            <PasswordRequirements
              id="password-requirements"
              password={values.password}
              invalid={Boolean(errors.password)}
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              Confirmar contraseña
            </label>
            <input type="password" autoComplete="new-password" {...fieldProps('passwordConfirm')} />
            {fieldError('passwordConfirm')}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : isCheckout ? 'Crear cuenta y continuar' : 'Crear cuenta'}
          </button>
        </form>

        {googleSignInEnabled && (
          <GoogleSignInButton onToken={handleGoogleToken} onError={setError} disabled={loading} />
        )}

        <p className="mt-6 text-center text-base text-[var(--color-text-muted)]">
          ¿Ya tienes cuenta?{' '}
          <Link href={loginHref} className="font-semibold text-[var(--color-primary-text)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
