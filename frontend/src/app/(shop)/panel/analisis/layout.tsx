import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Análisis — Panel — Juguetes para Frikis',
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
