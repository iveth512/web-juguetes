'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  authLogin, authRegister, authLogout, authGetUser,
  authUpdateUser, authChangePassword, authGoogleLogin,
} from '@/lib/api';
import type { LoginCredentials, RegisterData, User } from '@/types/auth';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

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
    await fetchUser();
  }, [fetchUser]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    await authGoogleLogin(credential);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try { await authLogout(); } catch { /* ignore */ }
    store.clearUser();
    router.push('/');
  }, [store, router]);

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
