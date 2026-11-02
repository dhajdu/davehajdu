// Pure formatting helpers, safe in client components (no server-only import).
// metrics.ts re-exports them for the server side.

export type Direction = 'higher_better' | 'lower_better' | 'target';

export function formatNumber(v: number, unit?: string | null): string {
  const digits = Math.abs(v) >= 1000 || unit === 'steps' || unit === 'kcal' || unit === 'count' ? 0 : 1;
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function formatValue(v: number | null, unit?: string | null): string {
  if (v === null) return 'No data';
  const n = formatNumber(v, unit);
  if (!unit || unit === 'count') return n;
  return unit === '%' ? `${n}%` : `${n} ${unit}`;
}

// 'better' | 'worse' | 'neutral' for a change, given the metric direction.
export function trendTone(delta: number, direction: Direction): 'better' | 'worse' | 'neutral' {
  if (delta === 0 || direction === 'target') return 'neutral';
  const up = delta > 0;
  return (direction === 'higher_better') === up ? 'better' : 'worse';
}
