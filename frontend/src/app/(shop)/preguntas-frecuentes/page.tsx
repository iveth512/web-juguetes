import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes — Juguetes para Frikis',
  description:
    'Encuentra respuestas a las preguntas mas comunes sobre envios, pagos, devoluciones y productos en Juguetes para Frikis.',
};

const FAQS = [
  {
    question: 'Todos los productos son originales?',
    answer:
      'Si, todos nuestros productos son 100% originales. Importamos directamente desde fabricantes y distribuidores autorizados en Estados Unidos y Japon.',
  },
  {
    question: 'Cuanto tiempo tarda el envio?',
    answer:
      'El tiempo de envio depende de tu ubicacion. Para Bogota es de 1-2 dias habiles, Medellin y Cali de 2-3 dias, y para el resto del pais de 3-5 dias habiles.',
  },
  {
    question: 'Hacen envios a toda Colombia?',
    answer:
      'Si, realizamos envios a todas las ciudades y municipios de Colombia a traves de transportadoras confiables.',
  },
  {
    question: 'El envio es gratis?',
    answer:
      'El envio es gratis en compras superiores a $250.000 COP. Para compras menores, el costo de envio varia segun la zona de destino.',
  },
  {
    question: 'Que metodos de pago aceptan?',
    answer:
      'Aceptamos tarjetas de credito y debito (Visa, Mastercard, American Express, Diners y otras) y PSE. Los pagos se procesan de forma segura a traves de Bold: nunca guardamos los datos de tu tarjeta.',
  },
  {
    question: 'Puedo devolver un producto?',
    answer:
      'Si, aceptamos devoluciones dentro de los 30 dias posteriores a la entrega. El producto debe estar en su empaque original y sin uso. Consulta nuestra politica de devoluciones para mas detalles.',
  },
  {
    question: 'Los precios incluyen IVA?',
    answer:
      'Si, todos los precios publicados en nuestro sitio incluyen IVA cuando aplica.',
  },
  {
    question: 'Como puedo contactarlos?',
    answer:
      'Puedes escribirnos por WhatsApp, Instagram o correo electronico. Visita nuestra pagina de contacto para ver todos los canales disponibles.',
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Preguntas Frecuentes</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold text-[var(--color-text)] mb-8">
        Preguntas Frecuentes
      </h1>

      <div className="space-y-6">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="border border-[var(--color-border)] rounded-lg p-5"
          >
            <h2 className="font-heading text-base font-bold text-[var(--color-text)] mb-2">
              {faq.question}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-[var(--color-bg-alt)] rounded-lg text-center">
        <p className="text-[var(--color-text)] font-semibold mb-2">
          No encontraste lo que buscabas?
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Estamos para ayudarte. Contactanos y resolveremos tus dudas.
        </p>
        <Link
          href="/contacto"
          className="inline-block px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Contactanos
        </Link>
      </div>
    </div>
  );
}
