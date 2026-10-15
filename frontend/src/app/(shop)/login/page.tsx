import { Suspense } from 'react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-alt)] p-6 sm:p-8 animate-pulse">
          <div className="h-8 w-48 mx-auto bg-[var(--color-border)] rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-[var(--color-border)] rounded" />
            <div className="h-10 bg-[var(--color-border)] rounded" />
            <div className="h-10 bg-[var(--color-border)] rounded" />
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
