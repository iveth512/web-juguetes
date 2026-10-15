import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const STORE_LINKS = [
  { href: "/novedades", label: "Novedades" },
  { href: "/ofertas", label: "Ofertas de la semana" },
  { href: "/franquicias", label: "Franquicias" },
  { href: "/productos", label: "Todos los productos" },
];

const HELP_LINKS = [
  { href: "/envios", label: "Envíos y entregas" },
  { href: "/devoluciones", label: "Devoluciones" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
];

const ABOUT_LINKS = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos y condiciones" },
];

const COLUMNS = [
  { title: "Tienda", links: STORE_LINKS },
  { title: "Ayuda", links: HELP_LINKS },
  { title: "La tienda", links: ABOUT_LINKS },
];

export function Footer() {
  return (
    <footer className="grain mt-auto bg-[var(--color-stage)] text-[var(--color-stage-text)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="max-w-sm">
            <Logo still className="h-12" />
            <p className="mt-5 text-base leading-relaxed text-[var(--color-stage-muted)]">
              Funko Pop! originales de anime, Marvel, Star Wars, Pokémon, música y mucho más,
              con envío a toda Colombia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="text-base font-semibold">{column.title}</h3>
                <ul className="mt-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-10 items-center text-base text-[var(--color-stage-muted)] transition-colors hover:text-[var(--color-stage-text)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p
          aria-hidden="true"
          className="type-hero mt-16 select-none whitespace-nowrap text-[clamp(1.75rem,calc(11.6vw-4px),9.25rem)] leading-[0.82] text-[var(--color-primary)] md:mt-24"
        >
          Juguetes para frikis
        </p>

        <p className="mt-6 text-sm text-[var(--color-stage-muted)]">
          &copy; {new Date().getFullYear()} Juguetes para Frikis. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
