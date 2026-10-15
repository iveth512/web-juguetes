import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — Juguetes para Frikis',
  description:
    'Respuestas sobre originalidad, envíos, pagos y devoluciones en Juguetes para Frikis.',
};

interface Faq {
  question: string;
  answer: React.ReactNode;
}

const linkClass =
  'font-semibold text-[var(--color-primary-text)] underline underline-offset-4';

const groups: { title: string; faqs: Faq[] }[] = [
  {
    title: 'Productos',
    faqs: [
      {
        question: '¿Todos los productos son originales?',
        answer:
          'Sí. Vendemos solo Funko Pop! originales, importados desde fabricantes y distribuidores autorizados. No vendemos réplicas ni productos sin licencia.',
      },
      {
        question: '¿Los precios incluyen IVA?',
        answer: 'Sí, todos los precios publicados incluyen IVA cuando aplica.',
      },
    ],
  },
  {
    title: 'Envíos',
    faqs: [
      {
        question: '¿Hacen envíos a toda Colombia?',
        answer:
          'Sí, enviamos a todas las ciudades y municipios del país con transportadoras aliadas.',
      },
      {
        question: '¿Cuánto tarda el envío?',
        answer: (
          <>
            Bogotá, de 1 a 2 días hábiles; Medellín y Cali, de 2 a 3; el resto del país, de 3 a
            5. Consulta las tarifas por zona en{' '}
            <Link href="/envios" className={linkClass}>
              Envíos
            </Link>
            .
          </>
        ),
      },
      {
        question: '¿El envío es gratis?',
        answer:
          'Es gratis en compras desde $250.000. Por debajo de ese valor pagas la tarifa de tu zona, que ves en el checkout antes de pagar.',
      },
    ],
  },
  {
    title: 'Pagos y devoluciones',
    faqs: [
      {
        question: '¿Qué métodos de pago aceptan?',
        answer:
          'Tarjetas de crédito y débito (Visa, Mastercard, American Express, Diners y otras) y PSE. Los pagos se procesan a través de Bold; nunca guardamos los datos de tu tarjeta.',
      },
      {
        question: '¿Puedo devolver un producto?',
        answer: (
          <>
            Sí, dentro de los 30 días siguientes a la entrega, siempre que la figura esté sin abrir
            y en su caja original. Hay excepciones, como artículos de edición limitada; revisa las
            condiciones completas en{' '}
            <Link href="/devoluciones" className={linkClass}>
              Cambios y devoluciones
            </Link>
            .
          </>
        ),
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
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
          Preguntas frecuentes
        </span>
      </nav>

      <header className="mt-6 mb-4 md:mb-8">
        <h1 className="type-page text-[var(--color-text)]">Preguntas frecuentes</h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--color-text)]">
          Lo que más nos preguntan antes y después de comprar.
        </p>
      </header>

      {groups.map((group) => (
        <section
          key={group.title}
          aria-label={group.title}
          className="grid gap-6 py-12 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-16 md:py-16"
        >
          <h2 className="type-section text-[var(--color-text)]">{group.title}</h2>
          <dl className="flex flex-col gap-8">
            {group.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-xl font-semibold leading-snug text-[var(--color-text)]">
                  {faq.question}
                </dt>
                <dd className="mt-2 max-w-[65ch] text-base leading-relaxed text-[var(--color-text)]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="grain mt-8 rounded-2xl bg-[var(--color-stage)] p-6 md:p-12 md:flex md:items-center md:justify-between md:gap-10">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-stage-text)]">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="mt-2 text-base text-[var(--color-stage-muted)]">
            Escríbenos por WhatsApp, correo o Instagram.
          </p>
        </div>
        <Link
          href="/contacto"
          className="mt-6 md:mt-0 inline-flex shrink-0 items-center min-h-11 px-6 rounded-full text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Ir a contacto
        </Link>
      </section>
    </div>
  );
}
