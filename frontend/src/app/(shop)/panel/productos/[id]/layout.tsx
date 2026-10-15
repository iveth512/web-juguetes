import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editar producto — Panel — Juguetes para Frikis',
};

export default function EditarProductoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
