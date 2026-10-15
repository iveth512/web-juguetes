import { adminCardClass } from '@/components/admin/AdminShell';

export function InsightCard({ id, headline, context, action, table, empty, children }: {
  id: string;
  headline: string;
  context?: React.ReactNode;
  action?: string;
  table?: React.ReactNode;
  /** When set, the chart is replaced by this low-data note. */
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`${adminCardClass} grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10`}>
      <div className="flex flex-col">
        <h2 id={id} className="text-xl font-semibold leading-snug text-balance text-[var(--color-text)] md:text-2xl">{headline}</h2>
        {context && <div className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{context}</div>}
        {action && !empty && (
          <p className="mt-4 rounded-lg bg-[var(--color-bg-alt)] px-3.5 py-3 text-sm leading-relaxed text-[var(--color-text)] lg:mt-auto">
            <strong className="font-semibold">Qué hacer: </strong>{action}
          </p>
        )}
      </div>
      <div className="min-w-0">
        {empty ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg bg-[var(--color-bg-alt)] px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
            {empty}
          </div>
        ) : (
          <>
            {children}
            {table && (
              <details className="group mt-4">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-[var(--color-primary-text)] hover:underline [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Ver como tabla</span>
                  <span className="hidden group-open:inline">Ocultar tabla</span>
                </summary>
                <div className="mt-1 max-h-72 overflow-auto">{table}</div>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function InsightSkeleton() {
  return (
    <div className={`${adminCardClass} grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10`} aria-hidden>
      <div className="space-y-3">
        <div className="h-7 w-11/12 animate-pulse rounded bg-[var(--color-bg-alt)]" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-[var(--color-bg-alt)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg-alt)]" />
      </div>
      <div className="h-44 animate-pulse rounded-lg bg-[var(--color-bg-alt)]" />
    </div>
  );
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-left text-xs text-[var(--color-text-muted)]">
          {head.map((h, i) => <th key={h} scope="col" className={`py-1.5 pr-2 font-semibold ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="border-t border-[var(--color-border)]">
            {r.map((c, i) => <td key={i} className={`py-1.5 pr-2 text-[var(--color-text)] ${i > 0 ? 'text-right tabular-nums whitespace-nowrap' : ''}`}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
