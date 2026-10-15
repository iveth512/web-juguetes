import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terminos y Condiciones — Juguetes para Frikis',
  description:
    'Consulta los terminos y condiciones de uso de Juguetes para Frikis.',
};

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Terminos y Condiciones</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold text-[var(--color-text)] mb-8">
        Terminos y Condiciones
      </h1>

      <div className="prose max-w-none space-y-6 text-[var(--color-text)]">
        <section>
          <h2 className="font-heading text-xl font-bold mb-3">1. Informacion General</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Juguetes para Frikis es una tienda en linea dedicada a la venta de juguetes y coleccionables importados.
            Al usar nuestro sitio web y realizar compras, aceptas estos terminos y condiciones.
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
          <h2 className="font-heading text-xl font-bold mb-3">3. Compras y Pagos</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Al realizar una compra, te comprometes a proporcionar informacion veraz y completa.
            Nos reservamos el derecho de cancelar pedidos si detectamos informacion incorrecta
            o actividad sospechosa. Los metodos de pago aceptados se muestran al momento del checkout.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">4. Envios</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Los tiempos de envio varian segun la zona de destino. Consulta nuestra{' '}
            <Link href="/envios" className="text-[var(--color-primary)] hover:underline">
              pagina de envios
            </Link>{' '}
            para mas informacion sobre costos y tiempos de entrega.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">5. Devoluciones</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Aceptamos devoluciones dentro de los 30 dias posteriores a la entrega. Consulta nuestra{' '}
            <Link href="/devoluciones" className="text-[var(--color-primary)] hover:underline">
              politica de devoluciones
            </Link>{' '}
            para conocer los requisitos y el proceso.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">6. Propiedad Intelectual</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Todas las marcas, logos y nombres de productos mencionados en este sitio pertenecen
            a sus respectivos propietarios. Juguetes para Frikis es un distribuidor autorizado
            y no reclama propiedad sobre ninguna de estas marcas.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold mb-3">7. Contacto</h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Si tienes preguntas sobre estos terminos, no dudes en{' '}
            <Link href="/contacto" className="text-[var(--color-primary)] hover:underline">
              contactarnos
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
