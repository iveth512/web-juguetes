import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo producto — Panel — Juguetes para Frikis',
};

export default function NuevoProductoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
