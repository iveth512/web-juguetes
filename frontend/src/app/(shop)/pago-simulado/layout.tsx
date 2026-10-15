import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pago simulado — Juguetes para Frikis',
  robots: { index: false, follow: false },
};

export default function SimulatedPaymentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
