import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterContent } from './RegisterContent';

export const metadata: Metadata = {
  title: 'Crear cuenta — Juguetes para Frikis',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
          <div className="h-[36rem] w-full max-w-md animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
