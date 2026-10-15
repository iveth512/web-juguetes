import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Panel — Juguetes para Frikis',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
