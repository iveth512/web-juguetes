'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { ChevronRight, Heart, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';

const inputClass =
  'w-full min-h-11 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

function AccountContent() {
  const { user, updateProfile, changePassword } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [addressMsg, setAddressMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, phone });
      setProfileMsg({ type: 'success', text: 'Datos actualizados.' });
    } catch {
      setProfileMsg({ type: 'error', text: 'No pudimos guardar tus datos. Inténtalo de nuevo.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddressMsg(null);
    setAddressLoading(true);
    try {
      await updateProfile({ address, city, department });
      setAddressMsg({ type: 'success', text: 'Dirección actualizada.' });
    } catch {
      setAddressMsg({ type: 'error', text: 'No pudimos guardar la dirección. Inténtalo de nuevo.' });
    } finally {
      setAddressLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const canChangePassword =
    oldPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    newPassword === confirmPassword;

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMsg({ type: 'error', text: 'No pudimos cambiar la contraseña. Verifica tu contraseña actual.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
          Inicio
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          Mi cuenta
        </span>
      </nav>

      <header className="mt-6 mb-10 md:mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-page text-[var(--color-text)]">Mi cuenta</h1>
          {user?.email && (
            <p className="mt-3 text-base text-[var(--color-text-muted)] break-all">{user.email}</p>
          )}
        </div>
        <nav aria-label="Accesos de la cuenta" className="flex flex-wrap gap-2">
          <Link
            href="/pedidos"
            className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full bg-[var(--color-bg-alt)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            <Package strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            Mis pedidos
          </Link>
          <Link
            href="/favoritos"
            className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full bg-[var(--color-bg-alt)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            <Heart strokeWidth={1.75} className="w-4 h-4" aria-hidden="true" />
            Favoritos
          </Link>
        </nav>
      </header>

      <div className="flex flex-col gap-6">
        <form onSubmit={handleProfileSubmit} className={sectionClass}>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Datos personales</h2>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              Los usamos para tus pedidos y para contactarte si hay novedades con un envío.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" htmlFor="first-name">
                <input
                  id="first-name"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Apellido" htmlFor="last-name">
                <input
                  id="last-name"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Correo electrónico" htmlFor="email" hint="No se puede cambiar.">
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
              </Field>
              <Field label="Teléfono" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <FormFooter
              message={profileMsg}
              loading={profileLoading}
              label="Guardar datos"
              loadingLabel="Guardando…"
            />
          </div>
        </form>

        <form onSubmit={handleAddressSubmit} className={sectionClass}>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Dirección de envío</h2>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              La cargamos por defecto en el checkout; puedes cambiarla en cada compra.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Dirección" htmlFor="address">
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ciudad" htmlFor="city">
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Departamento" htmlFor="department">
                <input
                  id="department"
                  type="text"
                  autoComplete="address-level1"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <FormFooter
              message={addressMsg}
              loading={addressLoading}
              label="Guardar dirección"
              loadingLabel="Guardando…"
            />
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className={sectionClass}>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Contraseña</h2>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              Necesitas tu contraseña actual para elegir una nueva.
            </p>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <Field label="Contraseña actual" htmlFor="old-password">
              <input
                id="old-password"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Nueva contraseña" htmlFor="new-password">
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <PasswordRequirements password={newPassword} />
            </Field>
            <Field label="Confirmar nueva contraseña" htmlFor="confirm-password">
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!passwordsMatch}
                className={inputClass}
              />
              {!passwordsMatch && (
                <p className="mt-1 text-sm text-[var(--color-error)]">Las contraseñas no coinciden.</p>
              )}
            </Field>
            <FormFooter
              message={passwordMsg}
              loading={passwordLoading}
              disabled={!canChangePassword}
              label="Cambiar contraseña"
              loadingLabel="Cambiando…"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

const sectionClass =
  'grid gap-6 rounded-2xl bg-[var(--color-bg-alt)] p-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:p-10';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

type FormMessage = { type: 'success' | 'error'; text: string } | null;

function FormFooter({
  message,
  loading,
  disabled = false,
  label,
  loadingLabel,
}: {
  message: FormMessage;
  loading: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <button
        type="submit"
        disabled={disabled || loading}
        className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? loadingLabel : label}
      </button>
      {message && (
        <p
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`text-sm font-medium ${
            message.type === 'success' ? 'text-[var(--color-text)]' : 'text-[var(--color-error)]'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function CuentaPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
