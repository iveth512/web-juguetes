'use client';

import { useAuthStore } from '@/stores/authStore';

/** Staff accounts manage the store; they browse it as a preview but never buy. */
export function useIsStaff(): boolean {
  return useAuthStore((s) => Boolean(s.user?.is_staff));
}
