import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página no encontrada — Juguetes para Frikis',
  description: 'La página que buscas no existe o cambió de dirección.',
};

const SUGGESTED_LINKS = [
  { href: '/productos?franchise=marvel', label: 'Marvel' },
  { href: '/productos?franchise=star-wars', label: 'Star Wars' },
  { href: '/productos?franchise=el-senor-de-los-anillos', label: 'El Señor de los Anillos' },
  { href: '/productos?franchise=my-hero-academia', label: 'My Hero Academia' },
  { href: '/productos?franchise=dragon-ball', label: 'Dragon Ball' },
  { href: '/ofertas', label: 'Ofertas de la semana' },
];

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-16">
        <p aria-hidden="true" className="type-hero text-[clamp(7rem,18vw,12rem)] text-[var(--color-primary)]">
          404
        </p>
        <div className="max-w-[52ch]">
          <h1 className="type-page text-[var(--color-text)]">Esta figura no está en la repisa</h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]">
            La página que buscas no existe o cambió de dirección. Revisa el enlace o sigue
            buscando en el catálogo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/productos"
              className="inline-flex items-center min-h-11 px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-base font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Ver catálogo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center min-h-11 text-base font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      <section aria-labelledby="sugerencias" className="mt-16 md:mt-24">
        <h2 id="sugerencias" className="text-xl font-semibold text-[var(--color-text)]">
          O empieza por una franquicia
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center min-h-11 px-5 rounded-full bg-[var(--color-bg-alt)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
