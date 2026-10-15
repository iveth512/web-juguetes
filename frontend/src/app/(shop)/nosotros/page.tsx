import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nosotros — Juguetes para Frikis',
  description:
    'Somos una tienda colombiana de Funko Pop! originales, hecha por coleccionistas para coleccionistas.',
};

const values = [
  {
    title: 'Autenticidad',
    text: 'Solo vendemos figuras originales y licenciadas. Nunca réplicas.',
  },
  {
    title: 'Comunidad',
    text: 'Somos coleccionistas como tú: entendemos lo que significa encontrar esa figura que faltaba.',
  },
  {
    title: 'Servicio',
    text: 'Te acompañamos desde que eliges tu figura hasta que llega a tu puerta.',
  },
];

export default function NosotrosPage() {
  return (
    <div className="pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
        >
          <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
            Inicio
          </Link>
          <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[var(--color-text)] font-medium" aria-current="page">
            Nosotros
          </span>
        </nav>

        <header className="mt-6 mb-12 md:mb-16">
          <h1 className="type-page text-[var(--color-text)]">Nosotros</h1>
          <p className="mt-4 max-w-[62ch] type-lead text-[var(--color-text)]">
            Somos una tienda colombiana apasionada por los coleccionables y la cultura friki. Nos
            mueven el anime, los cómics, el cine y todo lo que hace especial a nuestra comunidad.
          </p>
        </header>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <section
          aria-labelledby="historia"
          className="grid gap-6 py-12 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:py-16"
        >
          <h2 id="historia" className="type-section text-[var(--color-text)]">
            Nuestra historia
          </h2>
          <div className="max-w-[65ch] flex flex-col gap-4 text-base leading-relaxed text-[var(--color-text)]">
            <p>
              Juguetes para Frikis nació como un emprendimiento familiar en Bogotá. Lo que empezó
              como una colección personal se convirtió en una tienda en línea cuando otros
              coleccionistas empezaron a preguntarnos dónde conseguir sus figuras.
            </p>
            <p>
              Hoy nos especializamos en Funko Pop! originales y elegimos cada referencia pensando en
              lo que la comunidad colombiana quiere tener en su repisa.
            </p>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="importacion"
        className="grain my-8 md:my-12 bg-[var(--color-stage)] text-[var(--color-stage-text)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid gap-6 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:items-end md:gap-16">
          <h2 id="importacion" className="type-section">
            Originales, siempre
          </h2>
          <p className="max-w-[52ch] text-lg leading-relaxed">
            Cada figura viene de fabricantes y distribuidores oficiales, principalmente de Estados
            Unidos. Así garantizamos su autenticidad: nunca vendemos réplicas ni productos sin
            licencia.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <section
          aria-labelledby="mision"
          className="grid gap-6 py-12 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:py-16"
        >
          <h2 id="mision" className="type-section text-[var(--color-text)]">
            Nuestra misión
          </h2>
          <p className="max-w-[65ch] text-base leading-relaxed text-[var(--color-text)]">
            Ser el puente entre la cultura pop internacional y los fans en Colombia: figuras
            originales, atención cercana y envíos a todo el país.
          </p>
        </section>

        <section
          aria-labelledby="valores"
          className="grid gap-8 py-12 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:py-16"
        >
          <h2 id="valores" className="type-section text-[var(--color-text)]">
            Lo que nos importa
          </h2>
          <dl className="flex flex-col gap-8">
            {values.map(({ title, text }) => (
              <div key={title}>
                <dt className="text-xl font-semibold text-[var(--color-text)]">{title}</dt>
                <dd className="mt-1 max-w-[60ch] text-base leading-relaxed text-[var(--color-text)]">
                  {text}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8 rounded-2xl bg-[var(--color-bg-alt)] p-6 md:p-12 md:flex md:items-center md:justify-between md:gap-10">
          <p className="text-xl font-semibold text-[var(--color-text)]">
            ¿Buscas una figura en particular?
          </p>
          <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/productos"
              className="inline-flex items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Ver catálogo
            </Link>
            <Link
              href="/contacto"
              className="text-sm font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
            >
              Escríbenos
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
