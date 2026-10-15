'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/panel/dashboard', label: 'Dashboard' },
  { href: '/panel/productos', label: 'Productos' },
  { href: '/panel/productos/nuevo', label: 'Nuevo producto' },
];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // The API enforces admin access too; this only keeps customers off the UI.
  useEffect(() => {
    if (user && !user.is_staff) router.replace('/');
  }, [user, router]);

  if (!user?.is_staff) return null;
  return <>{children}</>;
}

export function AdminShell({ title, actions, children }: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/panel/productos'
      ? pathname === href || /^\/panel\/productos\/(?!nuevo)/.test(pathname)
      : pathname === href;

  return (
    <ProtectedRoute>
      <AdminGuard>
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <nav aria-label="Administración" className="mb-6 flex flex-wrap gap-1 border-b border-[var(--color-border)]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-base font-semibold border-b-2 -mb-px transition-colors',
                  isActive(item.href)
                    ? 'border-[var(--color-primary)] text-[var(--color-primary-text)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="type-page text-[var(--color-text)]">{title}</h1>
            {actions}
          </div>
          {children}
        </div>
      </AdminGuard>
    </ProtectedRoute>
  );
}

export const adminInputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

export const adminCardClass =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]';
