import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Privacidad — Juguetes para Frikis',
  description:
    'Lee nuestra politica de privacidad y conoce como tratamos tus datos personales en Juguetes para Frikis.',
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Politica de Privacidad</span>
      </nav>

      {/* Title */}
      <h1
        className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl mb-2"
        style={{ color: 'var(--color-text)' }}
      >
        Politica de Privacidad
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Ultima actualizacion: enero de 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            1. Responsable del tratamiento
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Juguetes para Frikis es responsable del tratamiento de los datos personales que recopilamos
            a traves de nuestro sitio web y canales de comunicacion. Nuestros datos de contacto se
            encuentran en la seccion de{' '}
            <Link href="/contacto" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
              Contacto
            </Link>
            .
          </p>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            2. Datos que recopilamos
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Recopilamos los siguientes tipos de datos personales:
          </p>
          <ul className="space-y-2" style={{ color: 'var(--color-text-muted)' }}>
            {[
              'Datos de identificacion: nombre y apellidos.',
              'Datos de contacto: correo electronico, numero de telefono y direccion de entrega.',
              'Datos de transaccion: historial de pedidos y preferencias de compra.',
              'Datos de navegacion: cookies y datos de uso del sitio web (de forma anonima y agregada).',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            3. Finalidad del tratamiento
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Utilizamos tus datos personales para: procesar y gestionar tus pedidos, comunicarnos
            contigo sobre el estado de tus compras, enviarte informacion sobre ofertas y novedades
            (solo si has dado tu consentimiento), mejorar nuestros productos y servicios, y cumplir
            con las obligaciones legales aplicables.
          </p>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            4. Conservacion de datos
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Conservamos tus datos personales durante el tiempo necesario para cumplir con las
            finalidades descritas en esta politica, y en todo caso durante el tiempo requerido
            por la legislacion colombiana vigente (Ley 1581 de 2012 y sus decretos reglamentarios).
          </p>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            5. Tus derechos
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Tienes derecho a acceder, rectificar, suprimir y portabilidad de tus datos personales,
            asi como a oponerte al tratamiento o solicitar la limitacion del mismo. Para ejercer
            cualquiera de estos derechos, contactanos a traves de los canales disponibles en la
            seccion de Contacto.
          </p>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            6. Cookies
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Utilizamos cookies tecnicas necesarias para el funcionamiento del sitio y cookies
            analiticas anonimas para mejorar la experiencia de usuario. Puedes configurar tu
            navegador para rechazar las cookies, aunque esto puede afectar la funcionalidad
            del sitio.
          </p>
        </section>

        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            7. Cambios en la politica
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Nos reservamos el derecho de modificar esta politica en cualquier momento. Los cambios
            seran publicados en esta pagina con la fecha de actualizacion correspondiente. Te
            recomendamos revisarla periodicamente.
          </p>
        </section>
      </div>
    </div>
  );
}
