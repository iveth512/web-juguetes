import { Sticker, type StickerTone } from '@/components/ui/Sticker';
import { cn } from '@/lib/utils';

/*
 * Full-width grounds for editorial sections. Each one re-points the chart and border
 * variables so marks keep their roles (orange = what matters, lilac = context) on its colour.
 */
export const GROUNDS = {
  paper: '[--misreg-ink:rgba(45,27,105,0.5)] dark:[--misreg-ink:#5B47A8]',
  stage:
    'on-dark grain bg-[var(--color-stage)] [--misreg-ink:#5B47A8] [--color-border:#2E2360] [--ins-hi:#F57C20] [--ins-ctx:#43358A] [--ins-2:#A495E6] [--ins-grid:#2E2360]',
  field:
    'grain bg-[#E6E1F4] dark:bg-[#1D1245] [--ins-hi:#C2570A] dark:[--ins-hi:#F57C20] [--misreg-ink:rgba(45,27,105,0.45)] dark:[--misreg-ink:#5B47A8] [--ins-ctx:#B3A8DA] dark:[--ins-ctx:#43358A] [--ins-grid:#CFC6EA] dark:[--ins-grid:#33286A] [--color-border:#CFC6EA] dark:[--color-border:#33286A]',
} as const;
export type Ground = keyof typeof GROUNDS;

export const containerClass = 'mx-auto w-full max-w-7xl px-4 md:px-8';

/** Bars grow from their baseline once, staggered by the caller; reduced motion is handled globally. */
export function ChartMotion() {
  return (
    <style href="ins-chart-motion" precedence="default">{`
      @keyframes ins-grow-x { from { transform: scaleX(0); } }
      @keyframes ins-grow-y { from { transform: scaleY(0); } }
      .ins-grow-x { transform-origin: left center; animation: ins-grow-x 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .ins-grow-y { transform-origin: center bottom; transform-box: fill-box; animation: ins-grow-y 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
    `}</style>
  );
}

export interface PullFigure {
  value: string;
  caption: React.ReactNode;
}

export interface StoryStamp {
  label: string;
  tone: StickerTone;
}

export type StoryLayout = 'split' | 'reverse' | 'wide' | 'pair';

function Pull({ pull, stamp, align = 'left' }: { pull: PullFigure; stamp?: StoryStamp; align?: 'left' | 'right' }) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'lg:text-right')}>
      <p className="misreg font-[family-name:var(--font-display)] text-[clamp(5.5rem,12vw,12rem)] uppercase leading-[0.82] tracking-[-0.01em] text-[var(--ins-hi)] tabular-nums">
        {pull.value}
      </p>
      <p className={cn('mt-5 max-w-[24ch] text-lg leading-snug text-[var(--color-text)]', align === 'right' && 'lg:ml-auto')}>{pull.caption}</p>
      {stamp && (
        <div className="mt-6">
          <Sticker tone={stamp.tone} tilt={-6} className="text-[22px]">{stamp.label}</Sticker>
        </div>
      )}
    </div>
  );
}

function TableToggle({ table }: { table: React.ReactNode }) {
  return (
    <details className="group mt-6">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-base font-semibold text-[var(--color-primary-text)] underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Ver como tabla</span>
        <span className="hidden group-open:inline">Ocultar tabla</span>
      </summary>
      <div className="mt-2 max-h-80 max-w-3xl overflow-auto">{table}</div>
    </details>
  );
}

/** One finding told as a short editorial story: pull figure, headline, lede, the chart, then what to do. */
export function Story({ id, ground, layout, pull, stamp, headline, lede, action, table, empty, children }: {
  id: string;
  ground: Ground;
  layout: StoryLayout;
  pull?: PullFigure;
  stamp?: StoryStamp;
  headline: string;
  lede?: React.ReactNode;
  action?: string;
  table?: React.ReactNode;
  /** When set, the chart and the pull figure give way to this low-data note. */
  empty?: string;
  children?: React.ReactNode;
}) {
  const showPull = pull && !empty;
  const head = (
    <>
      <h2 id={id} className="type-section max-w-[22ch] text-[var(--color-text)]">{headline}</h2>
      {lede && <div className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[var(--color-text)]">{lede}</div>}
    </>
  );
  const body = empty ? (
    <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-[var(--color-text-muted)]">{empty}</p>
  ) : (
    <>
      <div className="mt-12 min-w-0">{children}</div>
      {action && (
        <p className="mt-10 max-w-[60ch] text-lg leading-relaxed text-[var(--color-text)]">
          <strong className="font-semibold text-[var(--color-primary-text)]">Qué hacer:</strong> {action}
        </p>
      )}
      {table && <TableToggle table={table} />}
    </>
  );

  let content: React.ReactNode;
  if (layout === 'split' || layout === 'reverse') {
    const pullCol = showPull ? (
      <div className={cn(layout === 'reverse' && 'lg:order-last')}>
        <Pull pull={pull} stamp={stamp} align={layout === 'reverse' ? 'right' : 'left'} />
      </div>
    ) : null;
    content = (
      <div className={cn('grid gap-12 lg:gap-16', layout === 'split' ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        {pullCol}
        <div className={cn('min-w-0', !showPull && 'lg:col-span-2')}>{head}{body}</div>
      </div>
    );
  } else if (layout === 'wide') {
    content = (
      <>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
          <div className="min-w-0">{head}</div>
          {showPull && <Pull pull={pull} stamp={stamp} align="right" />}
        </div>
        {body}
      </>
    );
  } else {
    content = (
      <>
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
          <div className="min-w-0 max-w-4xl">{head}</div>
          {stamp && !empty && <Sticker tone={stamp.tone} tilt={5} className="mt-2 text-[22px]">{stamp.label}</Sticker>}
        </div>
        {body}
      </>
    );
  }

  return (
    <section aria-labelledby={id} className={cn('py-20 md:py-28', GROUNDS[ground])}>
      <div className={containerClass}>{content}</div>
    </section>
  );
}

export function StorySkeleton({ ground }: { ground: Ground }) {
  return (
    <div aria-hidden className={cn('py-20 md:py-28', GROUNDS[ground])}>
      <div className={cn(containerClass, 'grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
        <div className="h-40 w-3/4 animate-pulse rounded bg-[var(--ins-ctx)] opacity-50" />
        <div className="space-y-4">
          <div className="h-10 w-11/12 animate-pulse rounded bg-[var(--ins-ctx)] opacity-50" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-[var(--ins-ctx)] opacity-50" />
          <div className="mt-8 h-48 animate-pulse rounded bg-[var(--ins-ctx)] opacity-30" />
        </div>
      </div>
    </div>
  );
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-left text-xs text-[var(--color-text-muted)]">
          {head.map((h, i) => <th key={`${h}-${i}`} scope="col" className={`py-1.5 pr-2 font-semibold ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
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
