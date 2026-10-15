'use client';

import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  id?: string;
  /** After a failed submit: always shown, unmet rules in the error colour. */
  invalid?: boolean;
}

const requirements = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
];

export function PasswordRequirements({ password, id, invalid = false }: PasswordRequirementsProps) {
  if (!password && !invalid) return null;

  return (
    <ul id={id} className="mt-2 space-y-1">
      {requirements.map((req) => {
        const passes = req.test(password);
        return (
          <li
            key={req.label}
            className={cn(
              'flex items-center gap-2 text-sm',
              passes
                ? 'text-[var(--color-text)]'
                : invalid
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-text-muted)]'
            )}
          >
            {passes ? (
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            <span className="sr-only">{passes ? 'Cumple: ' : 'Falta: '}</span>
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
