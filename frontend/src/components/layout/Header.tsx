"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { SearchBar } from "./SearchBar";
import { MobileNav } from "./MobileNav";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/novedades", label: "Novedades" },
  { href: "/franquicias", label: "Franquicias" },
  { href: "/productos", label: "Productos" },
  { href: "/ofertas", label: "Ofertas de la semana" },
];

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navPathname, setNavPathname] = useState(pathname);
  if (pathname !== navPathname) {
    setNavPathname(pathname);
    setMobileNavOpen(false);
  }
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const { count: wishlistCount } = useWishlist();

  const totalItems = useCartStore((s) => s.totalItems());
  const hasHydrated = useCartStore((s) => s._hasHydrated);
  const cartCount = hasHydrated ? totalItems : 0;

  // Bounce the badge when the count changes; tracked during render instead of in an effect.
  const [badgeBounce, setBadgeBounce] = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);
  if (cartCount !== prevCount) {
    setPrevCount(cartCount);
    if (cartCount > 0) setBadgeBounce(true);
  }
  useEffect(() => {
    if (!badgeBounce) return;
    const timer = setTimeout(() => setBadgeBounce(false), 300);
    return () => clearTimeout(timer);
  }, [badgeBounce]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout.current) clearTimeout(userDropdownTimeout.current);
    setUserDropdownOpen(true);
  };
  const handleUserMouseLeave = () => {
    userDropdownTimeout.current = setTimeout(() => setUserDropdownOpen(false), 200);
  };

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Announcement bar - hidden on mobile to save space, sticky header stays visible */}
        <div className="hidden sm:block bg-[var(--color-accent)] text-white text-xs sm:text-sm text-center py-1.5 px-4 font-medium">
          Envio gratis en compras superiores a $250.000 COP | Todos nuestros
          productos son 100% originales
        </div>

        {/* Main header */}
        <div className="bg-[var(--color-secondary)]">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden text-white/80 hover:text-white transition-colors p-1"
              aria-label="Abrir menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Logo className="h-10" hop={4} />

            {/* SearchBar - hidden on mobile */}
            <div className="hidden lg:block flex-1 max-w-[480px] mx-auto">
              <SearchBar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                aria-label={
                  resolvedTheme === "dark"
                    ? "Cambiar a modo claro"
                    : "Cambiar a modo oscuro"
                }
              >
                {resolvedTheme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* Mi Cuenta */}
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <button
                    className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 text-sm"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="hidden md:inline">
                      Hola, {user?.first_name || 'Usuario'}
                    </span>
                  </button>

                  {/* User dropdown */}
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-0 w-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-xl py-2 transition-all duration-150",
                      userDropdownOpen
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-1"
                    )}
                  >
                    {user?.is_staff && (
                      <Link
                        href="/panel/dashboard"
                        className="block px-4 py-2 text-sm text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                      >
                        Panel de administración
                      </Link>
                    )}
                    {user?.is_staff && (
                      <hr className="my-1 border-[var(--color-border)]" />
                    )}
                    <Link
                      href="/cuenta"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/pedidos"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                    >
                      Mis Pedidos
                    </Link>
                    <hr className="my-1 border-[var(--color-border)]" />
                    <button
                      onClick={() => logout()}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                    >
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden md:inline">Mi Cuenta</span>
                </Link>
              )}

              {/* Favoritos */}
              <Link
                href={isAuthenticated ? "/favoritos" : "/login"}
                className="relative flex items-center gap-1.5 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
                <span className="hidden md:inline">Favoritos</span>
              </Link>

              {/* Cart */}
              <Link
                href="/carrito"
                className="relative text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                aria-label="Carrito de compras"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-bold transition-transform",
                      badgeBounce && "animate-bounce"
                    )}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation bar - desktop only */}
        <nav className="hidden lg:block bg-[var(--color-secondary-dark)]">
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
                        isActive
                          ? "text-white border-[var(--color-primary)]"
                          : "text-white/70 border-transparent hover:text-white hover:border-[var(--color-primary)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
