"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
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
        <p className="hidden sm:block bg-[var(--color-accent)] text-[var(--color-on-accent)] text-sm text-center py-1.5 px-4 font-medium">
          Envío gratis en compras desde $250.000. Todos nuestros Funko Pop! son originales.
        </p>

        {/* Main header */}
        <div className="bg-[var(--color-stage)]">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            </button>

            {/* Logo */}
            <Logo className="h-10" hop={4} />

            {/* SearchBar - hidden on mobile */}
            <div className="hidden lg:block flex-1 max-w-[480px] mx-auto">
              <SearchBar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-2 ml-auto">
              <Link
                href="/buscar"
                className="lg:hidden flex h-11 w-11 items-center justify-center rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Buscar productos"
              >
                <Search className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center text-white/75 hover:text-white transition-colors min-h-11 min-w-11 justify-center px-2.5 rounded-full hover:bg-white/10"
                aria-label={
                  resolvedTheme === "dark"
                    ? "Cambiar a modo claro"
                    : "Cambiar a modo oscuro"
                }
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Moon className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>

              {/* Mi cuenta */}
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <button
                    className="flex items-center gap-1.5 text-white/75 hover:text-white transition-colors min-h-11 min-w-11 justify-center px-2.5 rounded-full hover:bg-white/10 text-sm"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <User className="h-5 w-5" strokeWidth={1.75} />
                    <span className="hidden md:inline">
                      Hola, {user?.first_name || 'coleccionista'}
                    </span>
                  </button>

                  {/* User dropdown */}
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-0 w-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl shadow-lg py-2 transition-[opacity,transform,visibility] duration-150",
                      userDropdownOpen
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-1"
                    )}
                  >
                    {user?.is_staff && (
                      <Link
                        href="/panel/dashboard"
                        className="block px-4 py-2 text-sm text-[var(--color-primary-text)] font-semibold hover:bg-[var(--color-bg-alt)] transition-colors"
                      >
                        Panel de administración
                      </Link>
                    )}
                    {user?.is_staff && (
                      <hr className="my-1 border-[var(--color-border)]" />
                    )}
                    <Link
                      href="/cuenta"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/pedidos"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
                    >
                      Mis pedidos
                    </Link>
                    <hr className="my-1 border-[var(--color-border)]" />
                    <button
                      onClick={() => logout()}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-white/75 hover:text-white transition-colors min-h-11 min-w-11 justify-center px-2.5 rounded-full hover:bg-white/10 text-sm"
                >
                  <User className="h-5 w-5" strokeWidth={1.75} />
                  <span className="hidden md:inline">Mi cuenta</span>
                </Link>
              )}

              {/* Favoritos */}
              <Link
                href={isAuthenticated ? "/favoritos" : "/login"}
                className="relative flex items-center gap-1.5 text-white/75 hover:text-white transition-colors min-h-11 min-w-11 justify-center px-2.5 rounded-full hover:bg-white/10 text-sm"
              >
                <Heart className="h-5 w-5" strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-bold">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
                <span className="hidden md:inline">Favoritos</span>
              </Link>

              {/* Cart */}
              <Link
                href="/carrito"
                className="relative flex items-center text-white/75 hover:text-white transition-colors min-h-11 min-w-11 justify-center px-2.5 rounded-full hover:bg-white/10"
                aria-label={cartCount > 0 ? `Carrito, ${cartCount} productos` : "Carrito"}
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-bold transition-transform",
                      badgeBounce && "scale-125"
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
        <nav aria-label="Principal" className="hidden lg:block bg-[var(--color-stage)]">
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block px-4 py-3 text-[15px] font-medium transition-colors border-b-2",
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
