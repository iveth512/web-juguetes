import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categorias — Juguetes para Frikis',
  description:
    'Explora todas las categorias de coleccionables: Funko Pop, Figuras de Accion, Peluches, TCG, Estatuas y Accesorios.',
};

export default function CategoriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
