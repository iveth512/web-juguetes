import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Devoluciones — Juguetes para Frikis',
  description:
    'Consulta nuestra politica de devoluciones. Tienes 30 dias para devolver o cambiar tu producto en Juguetes para Frikis.',
};

export default function DevolucionesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Politica de Devoluciones</span>
      </nav>

      {/* Title */}
      <h1
        className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl mb-8"
        style={{ color: 'var(--color-text)' }}
      >
        Politica de Devoluciones
      </h1>

      <div className="space-y-8">
        {/* Banner 30 dias */}
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
            30 dias para devoluciones
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            En Juguetes para Frikis queremos que estes 100% satisfecho con tu compra. Por eso,
            te damos 30 dias calendario desde la fecha de entrega para solicitar una devolucion
            o cambio.
          </p>
        </section>

        {/* Condiciones */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Condiciones para la devolucion
          </h2>
          <ul className="space-y-2 list-none">
            {[
              'El producto debe estar en su empaque original, sin abrir y sin danos.',
              'Debes presentar el comprobante de compra o numero de pedido.',
              'Los productos en oferta o liquidacion pueden tener restricciones adicionales.',
              'Los articulos personalizados o de edicion limitada no son elegibles para devolucion.',
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span
                  className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Proceso */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Como solicitar una devolucion
          </h2>
          <ol className="space-y-4">
            {[
              { step: '1', text: 'Contactanos por WhatsApp o correo electronico indicando tu numero de pedido y el motivo de la devolucion.' },
              { step: '2', text: 'Nuestro equipo revisara tu solicitud en un plazo de 24 a 48 horas habiles y te informara si aplica la devolucion.' },
              { step: '3', text: 'Si la devolucion es aprobada, te enviaremos las instrucciones para el envio del producto de regreso.' },
              { step: '4', text: 'Una vez recibamos el producto y verifiquemos su estado, procesaremos el reembolso o cambio en un plazo de 5 dias habiles.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-4">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                >
                  {step}
                </span>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Reembolsos */}
        <section>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Reembolsos
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Los reembolsos se realizan por el mismo medio de pago utilizado en la compra, a traves
            de Bold. Si pagaste con PSE, el dinero se devuelve a la cuenta bancaria de origen.
            El tiempo de acreditacion puede variar segun tu entidad financiera.
          </p>
        </section>

        <section>
          <p style={{ color: 'var(--color-text-muted)' }}>
            ¿Necesitas ayuda con una devolucion?{' '}
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
