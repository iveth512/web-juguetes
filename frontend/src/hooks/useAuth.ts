'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import {
  authLogin, authRegister, authLogout, authGetUser,
  authUpdateUser, authChangePassword, authGoogleLogin,
} from '@/lib/api';
import type { LoginCredentials, RegisterData, User } from '@/types/auth';

/** The account exists but the automatic sign-in after registering failed. */
export class AccountCreatedError extends Error {
  constructor() {
    super('Tu cuenta se creó, pero no pudimos iniciar tu sesión. Inicia sesión con tu correo y contraseña.');
    this.name = 'AccountCreatedError';
  }
}

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchUser = useCallback(async () => {
    try {
      const user = await authGetUser();
      store.setUser(user);
      return user;
    } catch {
      store.clearUser();
      return null;
    }
  }, [store]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    await authLogin(credentials);
    await fetchUser();
  }, [fetchUser]);

  const register = useCallback(async (data: RegisterData) => {
    await authRegister(data);
    // The register endpoint creates the account without setting the session cookies.
    try {
      await authLogin({ email: data.email, password: data.password1 });
    } catch {
      throw new AccountCreatedError();
    }
    const user = await fetchUser();
    if (!user) throw new AccountCreatedError();
    return user;
  }, [fetchUser]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    await authGoogleLogin(credential);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try { await authLogout(); } catch { /* ignore */ }
    store.clearUser();
    // A shared device must not show the previous person's cart, wishlist or orders.
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
    queryClient.clear();
    router.push('/');
  }, [store, router, queryClient]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const updated = await authUpdateUser(data);
    store.setUser(updated);
    return updated;
  }, [store]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await authChangePassword({
      old_password: oldPassword,
      new_password1: newPassword,
      new_password2: newPassword,
    });
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login, register, loginWithGoogle, logout,
    updateProfile, changePassword, fetchUser,
  };
}
