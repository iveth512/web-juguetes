import { cn } from '@/lib/utils';

const badges = [
  {
    icon: '📦',
    title: 'Envio Seguro',
    description: 'A todo Colombia',
  },
  {
    icon: '🔄',
    title: 'Devoluciones 30 dias',
    description: 'Sin preguntas',
  },
  {
    icon: '🔒',
    title: 'Pago 100% Seguro',
    description: 'Bold + PSE',
  },
  {
    icon: '✅',
    title: '100% Originales',
    description: 'Importacion directa USA',
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className={cn(
                'flex flex-col items-center text-center p-5 rounded-lg',
                'border border-[var(--color-border)] bg-[var(--color-bg-card)]',
                'transition-colors duration-200',
                'hover:border-[var(--color-primary)]'
              )}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-2xl mb-3">
                {badge.icon}
              </div>
              <h3 className="font-heading text-[13px] font-bold text-[var(--color-text)]">
                {badge.title}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
