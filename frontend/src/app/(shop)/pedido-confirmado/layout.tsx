import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estado de tu pedido — Juguetes para Frikis',
  robots: { index: false, follow: false },
};

export default function OrderConfirmedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
