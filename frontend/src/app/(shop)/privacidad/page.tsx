import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de privacidad — Juguetes para Frikis',
  description:
    'Conoce cómo tratamos tus datos personales en Juguetes para Frikis, conforme a la Ley 1581 de 2012.',
};

const linkClass =
  'font-semibold text-[var(--color-primary-text)] underline underline-offset-4';

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'responsable',
    title: 'Responsable del tratamiento',
    body: (
      <p>
        Juguetes para Frikis es responsable del tratamiento de los datos personales que
        recopilamos a través de este sitio web y de nuestros canales de atención. Encuentras
        nuestros datos de contacto en la página de{' '}
        <Link href="/contacto" className={linkClass}>
          Contacto
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'datos',
    title: 'Datos que recopilamos',
    body: (
      <ul className="flex flex-col gap-2 list-disc pl-5 marker:text-[var(--color-text-muted)]">
        <li>Identificación: nombre y apellidos.</li>
        <li>Contacto: correo electrónico, número de teléfono y dirección de entrega.</li>
        <li>Transacciones: historial de pedidos y preferencias de compra.</li>
        <li>Navegación: cookies y datos de uso del sitio, de forma anónima y agregada.</li>
      </ul>
    ),
  },
  {
    id: 'finalidad',
    title: 'Para qué los usamos',
    body: (
      <p>
        Usamos tus datos para procesar y entregar tus pedidos, informarte sobre el estado de tus
        compras, enviarte novedades y ofertas (solo si lo autorizas), mejorar nuestros productos y
        servicios, y cumplir las obligaciones legales aplicables.
      </p>
    ),
  },
  {
    id: 'conservacion',
    title: 'Conservación',
    body: (
      <p>
        Conservamos tus datos el tiempo necesario para cumplir estas finalidades y, en todo caso,
        el que exija la legislación colombiana vigente (Ley 1581 de 2012 y sus decretos
        reglamentarios).
      </p>
    ),
  },
  {
    id: 'derechos',
    title: 'Tus derechos',
    body: (
      <p>
        Puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización que
        nos diste; saber cómo los usamos; revocar la autorización o pedir que los eliminemos
        cuando no exista un deber legal de conservarlos; y presentar quejas ante la
        Superintendencia de Industria y Comercio. Para ejercer cualquiera de estos derechos,
        escríbenos por los canales de{' '}
        <Link href="/contacto" className={linkClass}>
          Contacto
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        Usamos cookies técnicas necesarias para que el sitio funcione (por ejemplo, mantener tu
        sesión y tu carrito) y cookies analíticas anónimas para mejorar la experiencia. Puedes
        configurar tu navegador para rechazarlas, aunque algunas funciones del sitio podrían dejar
        de estar disponibles.
      </p>
    ),
  },
  {
    id: 'cambios',
    title: 'Cambios en esta política',
    body: (
      <p>
        Podemos actualizar esta política. Publicaremos cualquier cambio en esta página junto con
        la fecha de actualización.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
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
          Política de privacidad
        </span>
      </nav>

      <header className="mt-6 mb-12 md:mb-16">
        <h1 className="type-page text-[var(--color-text)]">Política de privacidad</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Última actualización: enero de 2025
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-16">
        <nav aria-label="Contenido de la política" className="hidden lg:block">
          <ul className="sticky top-28 flex flex-col">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center min-h-10 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-12 max-w-[68ch]">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28">
              <h2
                id={`${s.id}-title`}
                className="text-2xl font-semibold text-[var(--color-text)]"
              >
                {s.title}
              </h2>
              <div className="mt-3 text-base leading-relaxed text-[var(--color-text)]">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
