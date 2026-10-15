import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const STORE_LINKS = [
  { href: "/novedades", label: "Novedades" },
  { href: "/ofertas", label: "Ofertas de la semana" },
  { href: "/franquicias", label: "Franquicias" },
  { href: "/productos", label: "Todos los productos" },
];

const HELP_LINKS = [
  { href: "/envios", label: "Envios y entregas" },
  { href: "/devoluciones", label: "Devoluciones" },
  { href: "/contacto", label: "Contacto" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", icon: "📸" },
  { href: "https://facebook.com", label: "Facebook", icon: "📘" },
  { href: "https://tiktok.com", label: "TikTok", icon: "🎵" },
  { href: "https://twitter.com", label: "Twitter / X", icon: "🐦" },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-secondary)] text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Logo still className="mb-4 h-12" />
            <p className="text-white/60 text-sm leading-relaxed">
              Tu tienda de Funko Pop! favorita: anime, Marvel, Star Wars,
              Pokémon, música y mucho más. Todos nuestros productos son 100%
              originales, con envío a toda Colombia.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wider mb-4">
              Tienda
            </h3>
            <ul className="space-y-2.5">
              {STORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wider mb-4">
              Ayuda
            </h3>
            <ul className="space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Siguenos */}
          <div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-sm uppercase tracking-wider mb-4">
              Siguenos
            </h3>
            <ul className="space-y-2.5">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Juguetes para Frikis. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacidad"
              className="hover:text-white/70 transition-colors"
            >
              Politica de privacidad
            </Link>
            <Link
              href="/terminos"
              className="hover:text-white/70 transition-colors"
            >
              Terminos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
