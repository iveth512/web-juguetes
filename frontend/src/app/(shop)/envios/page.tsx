import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Informacion de Envios — Juguetes para Frikis',
  description:
    'Conoce nuestras zonas de envio, tiempos de entrega y politica de envio gratis para pedidos en Colombia.',
};

export default function EnviosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Informacion de Envios</span>
      </nav>

      {/* Title */}
      <h1
        className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl mb-8"
        style={{ color: 'var(--color-text)' }}
      >
        Informacion de Envios
      </h1>

      <div className="space-y-8" style={{ color: 'var(--color-text)' }}>
        {/* Cobertura */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Zonas de envio
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Realizamos envios a todo el territorio colombiano, incluyendo ciudades principales como
            Bogota, Medellin, Cali, Barranquilla, Cartagena, Bucaramanga y mas de 1.000 municipios
            a traves de nuestros operadores logisticos aliados.
          </p>
        </section>

        {/* Tiempos de entrega */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Tiempos de entrega
          </h2>
          <div
            className="rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-alt)' }}>
                  <th
                    className="text-left px-4 py-3 font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Zona
                  </th>
                  <th
                    className="text-left px-4 py-3 font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Tiempo estimado
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Bogota D.C.', '1 - 2 dias habiles'],
                  ['Ciudades principales', '2 - 4 dias habiles'],
                  ['Municipios intermedios', '3 - 6 dias habiles'],
                  ['Zonas rurales y apartadas', '5 - 10 dias habiles'],
                ].map(([zona, tiempo], i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-alt)',
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{zona}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{tiempo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Envio gratis */}
        <section
          className="rounded-lg p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-alt)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-2"
            style={{ color: 'var(--color-primary)' }}
          >
            Envio GRATIS en pedidos mayores a $150.000 COP
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Todos los pedidos que superen los $150.000 COP tienen envio gratis a cualquier parte
            de Colombia. Para pedidos menores, el costo de envio se calcula en el checkout segun
            tu ciudad de destino.
          </p>
        </section>

        {/* Seguimiento */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Seguimiento de tu pedido
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Una vez despachado tu pedido, recibiras un correo electronico con el numero de guia
            y el enlace de seguimiento del operador logistico. Tambien puedes consultar el estado
            de tu pedido contactandonos por WhatsApp o correo electronico.
          </p>
        </section>

        {/* Preguntas */}
        <section>
          <p style={{ color: 'var(--color-text-muted)' }}>
            ¿Tienes preguntas sobre tu envio?{' '}
            <Link
              href="/contacto"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Contactanos
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
