import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categorías — Juguetes para Frikis',
  description:
    'Explora las categorías de coleccionables originales de Juguetes para Frikis.',
};

export default function CategoriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
