import { chartTokens, toneColor, type Tone } from './tokens';

export type SwatchShape = 'bar' | 'dot' | 'ring';

export function Swatch({ tone, shape = 'bar' }: { tone: Tone; shape?: SwatchShape }) {
  if (shape === 'ring') {
    return <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full border-2" style={{ borderColor: tone === 'ctx' ? chartTokens.color.axis : toneColor[tone] }} />;
  }
  return <span aria-hidden className={`inline-block shrink-0 ${shape === 'dot' ? 'size-2.5 rounded-full' : 'h-2.5 w-3.5 rounded-sm'}`} style={{ background: toneColor[tone] }} />;
}

export function Legend({ items }: { items: { tone: Tone; label: string; shape?: SwatchShape }[] }) {
  return (
    <ul className={`mb-3 flex flex-wrap gap-x-4 gap-y-1 ${chartTokens.label.legend}`}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5"><Swatch tone={i.tone} shape={i.shape} />{i.label}</li>
      ))}
    </ul>
  );
}
