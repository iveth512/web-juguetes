import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finalizar compra — Juguetes para Frikis',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
