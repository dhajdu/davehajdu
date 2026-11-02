import type { Zone } from '@/lib/life/health';

// A recovery ring: percentage fill, coloured by Whoop zone.
export function Ring({ value, zone, label = '%', className = '' }: { value: number | null; zone: Zone | null; label?: string; className?: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <svg viewBox="0 0 96 96" className={`life-ring${zone ? ` is-${zone}` : ''} ${className}`} role="img" aria-label={value === null ? 'No reading' : `${Math.round(value)}${label}`}>
      <circle cx="48" cy="48" r={r} className="life-ring-track" />
      {value !== null && <circle cx="48" cy="48" r={r} className="life-ring-fill" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 48 48)" />}
      <text x="48" y="54" className="life-ring-n">{value === null ? '–' : Math.round(value)}</text>
      <text x="48" y="68" className="life-ring-of">{value === null ? 'NO DATA' : label}</text>
    </svg>
  );
}
