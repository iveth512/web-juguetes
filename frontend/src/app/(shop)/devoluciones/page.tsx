import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ChevronRight, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cambios y devoluciones — Juguetes para Frikis',
  description:
    'Tienes 30 días desde la entrega para solicitar un cambio o devolución de tu Funko Pop! sin abrir. Conoce las condiciones y el proceso.',
};

const accepted = [
  'La figura está sin abrir, en su caja original y sin golpes, rayones ni etiquetas añadidas.',
  'Solicitas el cambio o la devolución dentro de los 30 días calendario siguientes a la entrega.',
  'Nos indicas tu número de pedido o compartes el comprobante de compra.',
];

const excluded = [
  'Figuras con la caja abierta, dañada o sin sus elementos originales.',
  'Artículos personalizados o de edición limitada.',
  'Productos en oferta o liquidación con restricciones adicionales; te las confirmamos al revisar tu solicitud.',
];

const steps = [
  'Escríbenos por WhatsApp o correo con tu número de pedido y el motivo del cambio o la devolución.',
  'Revisamos tu solicitud en 24 a 48 horas hábiles y te confirmamos si aplica.',
  'Si la aprobamos, te enviamos las instrucciones para devolver el producto.',
  'Cuando lo recibimos y verificamos su estado, procesamos el cambio o el reembolso en un plazo de 5 días hábiles.',
];

export default function DevolucionesPage() {
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
            Cambios y devoluciones
          </span>
        </nav>

        <header className="mt-6 mb-12 md:mb-16">
          <h1 className="type-page text-[var(--color-text)]">Cambios y devoluciones</h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--color-text)]">
            Si tu figura llega y no es lo que esperabas, puedes cambiarla o devolverla mientras
            siga sellada. Aquí tienes las condiciones y los pasos.
          </p>
        </header>
      </div>

      <section
        aria-labelledby="plazo"
        className="grain bg-[var(--color-stage)] text-[var(--color-stage-text)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-16">
          <h2
            id="plazo"
            className="type-hero text-[var(--color-primary)]"
          >
            30 días
          </h2>
          <p className="max-w-[52ch] text-lg leading-relaxed">
            Cuentan desde la fecha en que recibes tu pedido. Dentro de ese plazo puedes solicitar
            un cambio por otra figura o el reembolso de tu dinero, siempre que el producto cumpla
            las condiciones de abajo.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <section aria-labelledby="condiciones" className="py-16 md:py-24">
          <h2 id="condiciones" className="type-section text-[var(--color-text)]">
            Condiciones
          </h2>
          <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="text-xl font-semibold text-[var(--color-text)]">
                Aceptamos tu solicitud si
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {accepted.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed">
                    <span className="mt-0.5 flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)]">
                      <Check strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[var(--color-text)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--color-text)]">No aplica para</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {excluded.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed">
                    <span className="mt-0.5 flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[var(--color-bg-alt)] text-[var(--color-text)]">
                      <X strokeWidth={1.75} className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[var(--color-text)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-10 max-w-[70ch] text-base leading-relaxed text-[var(--color-text-muted)]">
            Si el producto llega con un defecto de fábrica o no corresponde a lo que pediste,
            escríbenos aunque la caja esté abierta: lo revisamos como garantía. Esta política no
            limita tus derechos de garantía y retracto según el Estatuto del Consumidor (Ley 1480
            de 2011).
          </p>
        </section>

        <section
          aria-labelledby="proceso"
          className="grid gap-10 rounded-2xl bg-[var(--color-bg-alt)] p-6 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:p-12"
        >
          <h2 id="proceso" className="type-section text-[var(--color-text)]">
            Cómo solicitarlo
          </h2>
          <ol className="flex flex-col gap-6">
            {steps.map((text, i) => (
              <li key={text} className="flex items-start gap-4">
                <span className="grain flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-[var(--color-secondary)] text-base font-semibold text-white tabular-nums">
                  {i + 1}
                </span>
                <p className="pt-1 text-base leading-relaxed text-[var(--color-text)]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="reembolsos" className="py-16 md:py-24 max-w-[70ch]">
          <h2 id="reembolsos" className="type-section text-[var(--color-text)]">
            Reembolsos
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--color-text)]">
            Devolvemos el dinero por el mismo medio de pago que usaste en la compra, a través de
            Bold. Si pagaste con PSE, el reembolso llega a la cuenta bancaria de origen. El tiempo
            de acreditación depende de tu banco o entidad financiera.
          </p>
          <p className="mt-6 text-base leading-relaxed text-[var(--color-text)]">
            ¿Tienes un caso puntual?{' '}
            <Link
              href="/contacto"
              className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
            >
              Escríbenos
            </Link>{' '}
            y lo revisamos contigo.
          </p>
        </section>
      </div>
    </div>
  );
}
