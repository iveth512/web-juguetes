import type { Metadata } from 'next';
import Link from 'next/link';
import { AtSign, ChevronRight, Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto — Juguetes para Frikis',
  description:
    'Escríbenos por WhatsApp, correo o Instagram. Te ayudamos con pedidos, envíos y devoluciones.',
};

const channels = [
  {
    name: 'WhatsApp',
    value: '+57 300 123 4567',
    note: 'La vía más rápida en horario de atención.',
    href: 'https://wa.me/573001234567',
    external: true,
    Icon: MessageCircle,
  },
  {
    name: 'Correo electrónico',
    value: 'hola@juguetesparafrikis.com',
    note: 'Respondemos en menos de 24 horas hábiles.',
    href: 'mailto:hola@juguetesparafrikis.com',
    external: false,
    Icon: Mail,
  },
  {
    name: 'Instagram',
    value: '@juguetesparafrikis',
    note: 'Novedades, preventas y ofertas de la semana.',
    href: 'https://instagram.com/juguetesparafrikis',
    external: true,
    Icon: AtSign,
  },
];

const schedule = [
  { days: 'Lunes a viernes', hours: '9:00 a. m. a 7:00 p. m.' },
  { days: 'Sábados', hours: '10:00 a. m. a 3:00 p. m.' },
  { days: 'Domingos y festivos', hours: 'Cerrado' },
];

const helpLinks = [
  { href: '/envios', label: 'Envíos y tiempos de entrega' },
  { href: '/devoluciones', label: 'Cambios y devoluciones' },
  { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
];

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-16 md:pb-24">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link href="/" className="hover:text-[var(--color-primary-text)] transition-colors">
          Inicio
        </Link>
        <ChevronRight strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-[var(--color-text)] font-medium" aria-current="page">
          Contacto
        </span>
      </nav>

      <header className="mt-6 mb-12 md:mb-16">
        <h1 className="type-page text-[var(--color-text)]">Contacto</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text)]">
          ¿Dudas sobre una figura, tu pedido o un envío? Escríbenos por el canal que prefieras.
          Si ya compraste, ten a mano tu número de pedido para ayudarte más rápido.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <section aria-labelledby="canales">
          <h2 id="canales" className="type-section text-[var(--color-text)]">
            Canales
          </h2>
          <ul className="mt-8 flex flex-col gap-3">
            {channels.map(({ name, value, note, href, external, Icon }) => (
              <li key={name}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group flex items-start gap-4 rounded-2xl bg-[var(--color-bg-alt)] p-5 md:p-6 hover:bg-[var(--color-border)] transition-colors"
                >
                  <span className="grain flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-[var(--color-secondary)] text-white">
                    <Icon strokeWidth={1.75} className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-[var(--color-text-muted)]">{name}</span>
                    <span className="block text-lg md:text-xl font-semibold text-[var(--color-text)] break-words group-hover:text-[var(--color-primary-text)] transition-colors">
                      {value}
                    </span>
                    <span className="mt-1 block text-base text-[var(--color-text-muted)]">
                      {note}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <aside className="grain flex flex-col gap-10 rounded-2xl bg-[var(--color-stage)] p-6 md:p-10 self-start">
          <section aria-labelledby="horario">
            <h2 id="horario" className="text-2xl font-semibold text-[var(--color-stage-text)]">
              Horario de atención
            </h2>
            <dl className="mt-5 flex flex-col gap-3 text-base">
              {schedule.map(({ days, hours }) => (
                <div key={days} className="flex flex-wrap justify-between gap-x-4">
                  <dt className="text-[var(--color-stage-muted)]">{days}</dt>
                  <dd className="font-semibold text-[var(--color-stage-text)] tabular-nums">
                    {hours}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-[var(--color-stage-muted)]">Hora de Colombia.</p>
          </section>

          <section aria-labelledby="ayuda">
            <h2 id="ayuda" className="text-2xl font-semibold text-[var(--color-stage-text)]">
              Quizá ya está resuelto
            </h2>
            <ul className="mt-4 flex flex-col">
              {helpLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center justify-between gap-3 min-h-11 text-base text-[var(--color-stage-text)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {label}
                    <ChevronRight strokeWidth={1.75} className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
