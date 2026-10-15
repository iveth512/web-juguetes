import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pagina no encontrada — Juguetes para Frikis',
  description: 'La pagina que buscas no existe o fue movida.',
};

const SUGGESTED_LINKS = [
  { href: '/productos?franchise=demon-slayer', label: 'Demon Slayer' },
  { href: '/productos?franchise=naruto-shippuden', label: 'Naruto Shippuden' },
  { href: '/productos?franchise=one-piece', label: 'One Piece' },
  { href: '/productos?franchise=marvel', label: 'Marvel' },
  { href: '/productos?franchise=pokemon', label: 'Pokémon' },
  { href: '/ofertas', label: 'Ofertas de la semana' },
];

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Large 404 */}
        <p
          className="text-[120px] md:text-[160px] font-[family-name:var(--font-heading)] font-bold leading-none"
          style={{ color: 'var(--color-primary)' }}
        >
          404
        </p>

        {/* Title */}
        <h1
          className="font-[family-name:var(--font-heading)] font-bold text-2xl md:text-3xl mt-2 mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Pagina no encontrada
        </h1>

        {/* Subtitle */}
        <p
          className="text-base mb-8"
          style={{ color: 'var(--color-text-muted)' }}
        >
          La pagina que buscas no existe o fue movida. Quizas puedas encontrar lo que buscas aqui abajo.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-lg text-white font-semibold text-base transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={undefined}
        >
          Volver al inicio
        </Link>

        {/* Franchise suggestions */}
        <div className="mt-12">
          <p
            className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            O explora nuestras franquicias
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm border transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-bg-card)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
