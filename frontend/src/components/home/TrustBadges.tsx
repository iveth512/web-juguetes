import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const promises = [
  {
    icon: BadgeCheck,
    title: '100% originales',
    description: 'Importamos directamente de Estados Unidos. Nada de réplicas.',
  },
  {
    icon: Truck,
    title: 'Envío a toda Colombia',
    description: 'Gratis en compras desde $250.000.',
  },
  {
    icon: ShieldCheck,
    title: 'Pago seguro con Bold',
    description: 'Paga con tarjeta o PSE en la pasarela de Bold.',
  },
  {
    icon: RotateCcw,
    title: '30 días para devolver',
    description: 'Si la caja llega sin abrir y en su empaque original.',
  },
];

export function TrustBadges() {
  return (
    <section className="bg-[var(--color-bg)] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="type-section max-w-2xl text-[var(--color-text)]">Comprar aquí es sencillo</h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <Icon className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-primary-text)]" strokeWidth={1.75} aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
                <p className="mt-1 text-base leading-relaxed text-[var(--color-text-muted)]">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
