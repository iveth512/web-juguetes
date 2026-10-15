import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y condiciones — Juguetes para Frikis',
  description:
    'Consulta los términos y condiciones de uso de Juguetes para Frikis.',
};

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Términos y condiciones</span>
      </nav>

      <h1 className="type-page text-[var(--color-text)] mb-10">
        Términos y condiciones
      </h1>

      <div className="prose max-w-none space-y-6 text-[var(--color-text)]">
        <section>
          <h2 className="font-heading text-xl font-bold mb-3">1. Información general</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Juguetes para Frikis es una tienda en linea dedicada a la venta de juguetes y coleccionables importados.
            Al usar nuestro sitio web y realizar compras, aceptas estos términos y condiciones.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">2. Productos</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Todos nuestros productos son 100% originales e importados. Las imagenes son referenciales
            y pueden variar ligeramente del producto final. Los precios estan expresados en pesos colombianos (COP)
            e incluyen IVA cuando aplica.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">3. Compras y pagos</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Al realizar una compra, te comprometes a proporcionar información veraz y completa.
            Nos reservamos el derecho de cancelar pedidos si detectamos información incorrecta
            o actividad sospechosa. Los metodos de pago aceptados se muestran al momento del checkout.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">4. Envíos</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Los tiempos de envío varían según la zona de destino. Consulta nuestra{' '}
            <Link href="/envios" className="font-medium text-[var(--color-primary-text)] underline underline-offset-4">
              página de envíos
            </Link>{' '}
            para más información sobre costos y tiempos de entrega.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">5. Devoluciones</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Aceptamos devoluciones dentro de los 30 días posteriores a la entrega. Consulta nuestra{' '}
            <Link href="/devoluciones" className="font-medium text-[var(--color-primary-text)] underline underline-offset-4">
              política de devoluciones
            </Link>{' '}
            para conocer los requisitos y el proceso.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">6. Propiedad intelectual</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Todas las marcas, logos y nombres de productos mencionados en este sitio pertenecen
            a sus respectivos propietarios. Juguetes para Frikis es un distribuidor autorizado
            y no reclama propiedad sobre ninguna de estas marcas.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">7. Contacto</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Si tienes preguntas sobre estos términos, no dudes en{' '}
            <Link href="/contacto" className="font-medium text-[var(--color-primary-text)] underline underline-offset-4">
              contactarnos
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
