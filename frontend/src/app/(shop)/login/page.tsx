import { Suspense } from 'react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm animate-pulse">
          <div className="h-8 w-48 mx-auto bg-[var(--color-bg-alt)] rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-[var(--color-bg-alt)] rounded" />
            <div className="h-10 bg-[var(--color-bg-alt)] rounded" />
            <div className="h-10 bg-[var(--color-bg-alt)] rounded" />
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
