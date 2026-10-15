'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

function AccountContent() {
  const { user, updateProfile, changePassword } = useAuth();

  // Personal data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [addressMsg, setAddressMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Password
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
      setProfileMsg({ type: 'success', text: 'Datos actualizados correctamente.' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Error al actualizar los datos.' });
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
      setAddressMsg({ type: 'success', text: 'Direccion actualizada correctamente.' });
    } catch {
      setAddressMsg({ type: 'error', text: 'Error al actualizar la direccion.' });
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
      setPasswordMsg({ type: 'success', text: 'Contrasena cambiada correctamente.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMsg({ type: 'error', text: 'Error al cambiar la contrasena. Verifica tu contrasena actual.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Mi Cuenta</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold text-[var(--color-text)] mb-8">Mi Cuenta</h1>

      {/* Section 1: Datos personales */}
      <form
        onSubmit={handleProfileSubmit}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 mb-6"
      >
        <h2 className="font-heading text-xl font-semibold text-[var(--color-text)] mb-4">Datos personales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Nombre</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Apellido</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Correo electronico</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {profileMsg && (
          <p className={`text-sm mb-4 ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {profileMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={profileLoading}
          className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {profileLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      {/* Section 2: Direccion de envio */}
      <form
        onSubmit={handleAddressSubmit}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 mb-6"
      >
        <h2 className="font-heading text-xl font-semibold text-[var(--color-text)] mb-4">Direccion de envio</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Direccion</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Ciudad</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Departamento</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {addressMsg && (
          <p className={`text-sm mb-4 ${addressMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {addressMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={addressLoading}
          className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {addressLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      {/* Section 3: Cambiar contrasena */}
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 mb-6"
      >
        <h2 className="font-heading text-xl font-semibold text-[var(--color-text)] mb-4">Cambiar contrasena</h2>

        <div className="max-w-sm space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Contrasena actual</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Nueva contrasena</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
            <PasswordRequirements password={newPassword} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Confirmar nueva contrasena</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
            {!passwordsMatch && (
              <p className="text-red-500 text-xs mt-1">Las contrasenas no coinciden</p>
            )}
          </div>
        </div>

        {passwordMsg && (
          <p className={`text-sm mb-4 ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {passwordMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={!canChangePassword || passwordLoading}
          className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {passwordLoading ? 'Cambiando...' : 'Cambiar contrasena'}
        </button>
      </form>
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
