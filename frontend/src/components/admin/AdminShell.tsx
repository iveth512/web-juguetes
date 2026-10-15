'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/panel/dashboard', label: 'Dashboard' },
  { href: '/panel/productos', label: 'Productos' },
];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  // The API enforces admin access too; this only tells customers where they are.
  if (!user.is_staff) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <h1 className="type-page text-[var(--color-text)]">Sin acceso</h1>
        <p className="mt-4 text-base text-[var(--color-text-muted)]">Esta sección es solo para administradores.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Ir al inicio
          </Link>
          <Link
            href="/productos"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-6 text-base font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function AdminShell({ title, actions, children }: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ProtectedRoute>
      <AdminGuard>
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <nav aria-label="Administración" className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : isActive(item.href) ? 'true' : undefined}
                className={cn(
                  'shrink-0 whitespace-nowrap px-4 py-3 text-base font-semibold border-b-2 -mb-px transition-colors',
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

export const adminPillClass =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50';

export const adminSecondaryButtonClass = cn(
  adminPillClass,
  'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'
);
