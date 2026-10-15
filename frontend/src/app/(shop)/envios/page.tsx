import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Envíos — Juguetes para Frikis',
  description:
    'Enviamos a toda Colombia. Consulta costos y tiempos de entrega por zona. Envío gratis en compras desde $250.000.',
};

// Mirrors the active shipping zones configured in the backend.
const zones = [
  { zone: 'Bogotá', price: '$8.900', time: '1 a 2 días hábiles' },
  { zone: 'Medellín', price: '$12.900', time: '2 a 3 días hábiles' },
  { zone: 'Cali', price: '$12.900', time: '2 a 3 días hábiles' },
  { zone: 'Resto del país', price: '$18.900', time: '3 a 5 días hábiles' },
];

export default function EnviosPage() {
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
            Envíos
          </span>
        </nav>

        <header className="mt-6 mb-12 md:mb-16">
          <h1 className="type-page text-[var(--color-text)]">Envíos</h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--color-text)]">
            Enviamos a todo el territorio colombiano con transportadoras aliadas. El costo se
            calcula en el checkout según tu ciudad y lo ves antes de pagar.
          </p>
        </header>
      </div>

      <section
        aria-labelledby="envio-gratis"
        className="grain bg-[var(--color-stage)] text-[var(--color-stage-text)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-end md:gap-16">
          <h2 id="envio-gratis" className="type-hero">
            Envío gratis desde <span className="tabular-nums">$250.000</span>
          </h2>
          <p className="max-w-[48ch] text-lg leading-relaxed text-[var(--color-stage-text)]">
            Aplica a cualquier ciudad de Colombia cuando el subtotal de tu pedido llega a
            $250.000. Por debajo de ese valor, pagas la tarifa de tu zona.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <section aria-labelledby="tarifas" className="py-16 md:py-24">
          <h2 id="tarifas" className="type-section text-[var(--color-text)]">
            Tarifas y tiempos
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-base">
              <caption className="sr-only">Costo y tiempo de entrega por zona</caption>
              <thead>
                <tr className="text-sm text-[var(--color-text-muted)]">
                  <th scope="col" className="py-3 px-4 font-medium">Zona</th>
                  <th scope="col" className="py-3 px-4 font-medium">Costo</th>
                  <th scope="col" className="py-3 px-4 font-medium">Tiempo estimado</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(({ zone, price, time }) => (
                  <tr key={zone} className="odd:bg-[var(--color-bg-alt)]">
                    <th scope="row" className="py-4 px-4 rounded-l-xl font-semibold text-[var(--color-text)]">
                      {zone}
                    </th>
                    <td className="py-4 px-4 text-[var(--color-text)] tabular-nums">{price}</td>
                    <td className="py-4 px-4 rounded-r-xl text-[var(--color-text)]">{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-[var(--color-text-muted)]">
            Los tiempos cuentan desde que se confirma el pago y pueden extenderse en temporadas de
            alta demanda o en zonas de difícil acceso.
          </p>
        </section>

        <section
          aria-labelledby="seguimiento"
          className="grid gap-6 rounded-2xl bg-[var(--color-bg-alt)] p-6 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:p-12"
        >
          <h2 id="seguimiento" className="type-section text-[var(--color-text)]">
            Seguimiento
          </h2>
          <div className="max-w-[62ch]">
            <p className="text-base leading-relaxed text-[var(--color-text)]">
              Cuando despachamos tu pedido te enviamos un correo con el número de guía y el
              enlace de la transportadora. También puedes ver el estado de tus compras en{' '}
              <Link
                href="/pedidos"
                className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
              >
                Mis pedidos
              </Link>
              .
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]">
              ¿Algo no cuadra con tu envío?{' '}
              <Link
                href="/contacto"
                className="font-semibold text-[var(--color-primary-text)] underline underline-offset-4"
              >
                Escríbenos
              </Link>{' '}
              con tu número de pedido.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
