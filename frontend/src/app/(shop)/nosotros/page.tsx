import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Juguetes para Frikis',
  description:
    'Conoce la historia de Juguetes para Frikis, tu tienda de coleccionables favorita en Colombia. Importamos directamente desde USA.',
};

export default function NosotrosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Sobre Nosotros</span>
      </nav>

      {/* Title */}
      <h1
        className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl mb-4"
        style={{ color: 'var(--color-text)' }}
      >
        Sobre Nosotros
      </h1>

      {/* Hero text */}
      <p
        className="text-lg mb-10 leading-relaxed"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Somos una tienda colombiana apasionada por los coleccionables, los juguetes y la cultura
        friki. Nacimos del amor por Pokemon, los Funko Pop, los mangas y todo lo que hace especial
        a nuestra comunidad.
      </p>

      <div className="space-y-10">
        {/* Nuestra historia */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-2xl mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Nuestra historia
          </h2>
          <div className="space-y-4" style={{ color: 'var(--color-text-muted)' }}>
            <p>
              Juguetes para Frikis nacio en 2020 como un pequeno emprendimiento familiar en Bogota.
              Lo que comenzo como una coleccion personal de figuras y cartas Pokemon rapidamente
              se convirtio en una tienda online gracias a la demanda de la comunidad friki colombiana.
            </p>
            <p>
              Hoy somos uno de los destinos favoritos para coleccionistas en Colombia, con miles
              de productos disponibles y una comunidad fiel que crece cada dia.
            </p>
          </div>
        </section>

        {/* Importacion desde USA */}
        <section
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-alt)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-2xl mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            Importamos directamente desde USA
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Todos nuestros productos son 100% originales e importados directamente desde Estados Unidos
            y otros paises de origen. Trabajamos con distribuidores oficiales para garantizar la
            autenticidad de cada articulo. Nunca vendemos replicas ni productos no licenciados.
          </p>
        </section>

        {/* Nuestra mision */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-2xl mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Nuestra mision
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Llevar alegria y nostalgia a cada rincon de Colombia a traves de productos originales
            de calidad. Queremos ser el puente entre la cultura pop internacional y los fanaticos
            colombianos, ofreciendo siempre los mejores precios, la mejor atencion y envio rapido
            a todo el pais.
          </p>
        </section>

        {/* Valores */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-2xl mb-6"
            style={{ color: 'var(--color-text)' }}
          >
            Nuestros valores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Autenticidad',
                desc: 'Solo vendemos productos 100% originales con garantia de autenticidad.',
              },
              {
                title: 'Comunidad',
                desc: 'Somos frikis como tu. Entendemos tu pasion y la compartimos.',
              },
              {
                title: 'Servicio',
                desc: 'Tu satisfaccion es nuestra prioridad, desde el primer clic hasta la entrega.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-lg p-5 border"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3
                  className="font-[family-name:var(--font-heading)] font-bold text-base mb-2"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
            ¿Quieres saber mas o tienes alguna pregunta?
          </p>
          <Link
            href="/contacto"
            className="inline-block px-8 py-3 rounded-lg text-white font-semibold transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Contactanos
          </Link>
        </section>
      </div>
    </div>
  );
}
