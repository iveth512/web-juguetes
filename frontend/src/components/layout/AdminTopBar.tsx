'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, LogOut, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { href: '/panel/dashboard', label: 'Dashboard' },
  { href: '/panel/analisis', label: 'Análisis' },
  { href: '/panel/productos', label: 'Productos' },
];

/** Replaces the store header inside /panel: admins manage here, they don't shop. */
export function AdminTopBar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="grain sticky top-0 z-50 bg-[var(--color-stage)] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Logo href="/panel/dashboard" className="h-9" hop={3} />
        <span className="hidden rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/85 sm:inline">
          Panel de administración
        </span>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Ver tienda</span>
            <span className="sr-only sm:hidden">Ver tienda</span>
          </Link>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden md:inline">Cerrar sesión{user?.first_name ? ` (${user.first_name})` : ''}</span>
            <span className="sr-only md:hidden">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <nav aria-label="Panel" className="grain bg-[var(--color-stage)]">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block whitespace-nowrap border-b-2 px-4 py-3 text-[15px] font-medium transition-colors',
                    active
                      ? 'border-[var(--color-primary)] text-white'
                      : 'border-transparent text-white/70 hover:border-[var(--color-primary)] hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
