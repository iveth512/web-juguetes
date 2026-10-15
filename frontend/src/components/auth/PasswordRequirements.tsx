'use client';

import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
}

const requirements = [
  { label: 'Minimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos una mayuscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Al menos una minuscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Al menos un numero', test: (p: string) => /\d/.test(p) },
];

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {requirements.map((req) => {
        const passes = req.test(password);
        return (
          <li
            key={req.label}
            className={cn(
              'flex items-center gap-2 text-xs',
              passes ? 'text-green-600' : 'text-[var(--color-text-muted)]'
            )}
          >
            {passes ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}

export function isPasswordValid(password: string): boolean {
  return requirements.every((req) => req.test(password));
}
