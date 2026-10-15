import { Suspense } from 'react';
import { ResetPasswordContent } from './ResetPasswordContent';

export const metadata = {
  title: 'Restablecer contrasena',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-center mb-6">Nueva contrasena</h1>
        <Suspense fallback={<div className="h-40 animate-pulse bg-[var(--color-bg-alt)] rounded" />}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
