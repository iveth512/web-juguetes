'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFranchises } from '@/hooks/useProducts';

const franchiseIcons: Record<string, string> = {
  pokemon: '⚡',
  'dragon-ball': '🐉',
  naruto: '🍥',
  'one-piece': '🏴‍☠️',
  marvel: '🦸',
  dc: '🦇',
  'star-wars': '⭐',
  'demon-slayer': '🗡️',
};

function getIcon(slug: string): string {
  return franchiseIcons[slug] || '🎮';
}

export default function FranquiciasPage() {
  const { data: franchises, isLoading } = useFranchises();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Franquicias</span>
      </nav>

      <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-2">
        Franquicias
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Explora nuestros productos por tu franquicia favorita.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-[var(--color-bg-alt)] animate-pulse" />
            ))
          : franchises?.map((franchise) => (
              <Link
                key={franchise.id}
                href={`/productos?franchise=${franchise.slug}`}
                className={cn(
                  'flex flex-col items-center justify-center h-44 rounded-xl p-6',
                  'text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-xl'
                )}
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)',
                }}
              >
                <span className="text-4xl mb-3">{getIcon(franchise.slug)}</span>
                <h2 className="font-heading text-base font-bold text-center">{franchise.name}</h2>
              </Link>
            ))}
      </div>
    </div>
  );
}
