import { Suspense } from 'react';
import { ResetPasswordContent } from './ResetPasswordContent';

export const metadata = {
  title: 'Nueva contraseña — Juguetes para Frikis',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8">
        <h1 className="type-page mb-6 text-[clamp(2.25rem,4vw,2.75rem)] text-[var(--color-text)]">
          Nueva contraseña
        </h1>
        <Suspense fallback={<div className="h-40 animate-pulse bg-[var(--color-border)] rounded-xl" />}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
