import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrito de Compras — Juguetes para Frikis',
  robots: { index: false, follow: false },
};

export default function CarritoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
