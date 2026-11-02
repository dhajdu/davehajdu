// Hand-written SVG charts. Token hexes only: navy #04102D, blue #287BE8,
// magenta #D1458B, border #D4D9E0, muted #6B7280.

// `t` (ms since epoch) spaces points by time instead of evenly; sparse series
// like lab panels years apart need it.
type Point = { x: string; value: number; t?: number };

type Dims = { W: number; H: number; PAD: { top: number; right: number; bottom: number; left: number }; font: number };
const DIMS: Record<'full' | 'compact', Dims> = {
  full: { W: 600, H: 180, PAD: { top: 12, right: 8, bottom: 22, left: 40 }, font: 10 },
  compact: { W: 320, H: 150, PAD: { top: 14, right: 10, bottom: 22, left: 34 }, font: 11 },
};
export type ChartSize = keyof typeof DIMS;

// `domain` pins the axis: [0, 100] for a percentage, [0, null] to stop a
// non-negative signal from dipping below zero after padding.
export type Domain = [number | null, number | null];

function scale(points: Point[], zeroBased: boolean, extra: number[] = [], domain: Domain = [null, null], { H, PAD }: Dims = DIMS.full) {
  const vals = [...points.map((p) => p.value), ...extra];
  let min = zeroBased ? 0 : Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) {
    min = zeroBased ? 0 : min - 1;
    max = max + 1;
  }
  const pad = zeroBased ? 0 : (max - min) * 0.1;
  min -= pad;
  max += pad;
  if (domain[0] !== null) min = Math.max(min, domain[0]);
  if (domain[1] !== null) max = Math.min(max, domain[1]);
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;
  return { min, max, y };
}

function fmt(v: number) {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.abs(v) < 100 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10);
}

function Axis({ min, max, y, first, last, dims = DIMS.full }: { min: number; max: number; y: (v: number) => number; first: string; last: string; dims?: Dims }) {
  const { W, H, PAD, font } = dims;
  const ticks = [min, (min + max) / 2, max];
  return (
    <g fontSize={font} fill="#6B7280">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#D4D9E0" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end">{fmt(t)}</text>
        </g>
      ))}
      <text x={PAD.left} y={H - 6}>{first}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end">{last}</text>
    </g>
  );
}

// `target` draws a dashed magenta line (a goal) and keeps it inside the scale.
export function LineChart({ points, label, target, domain, size = 'full' }: { points: Point[]; label: string; target?: number | null; domain?: Domain; size?: ChartSize }) {
  if (points.length === 0) return null;
  const dims = DIMS[size];
  const { W, H, PAD, font } = dims;
  const { min, max, y } = scale(points, false, target != null ? [target] : [], domain, dims);
  const innerW = W - PAD.left - PAD.right;
  const timed = points.length > 1 && points.every((p) => p.t !== undefined);
  const t0 = timed ? points[0].t! : 0;
  const span = timed ? Math.max(1, points[points.length - 1].t! - t0) : 1;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : timed ? ((points[i].t! - t0) / span) * innerW : (i / (points.length - 1)) * innerW);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const lastP = points[points.length - 1];
  const dots = points.length <= 12;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <Axis min={min} max={max} y={y} first={points[0].x} last={lastP.x} dims={dims} />
      {target != null && (
        <g>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(target)} y2={y(target)} stroke="#D1458B" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={W - PAD.right} y={y(target) - 4} textAnchor="end" fontSize={font} fill="#D1458B" fontWeight="700">goal {fmt(target)}</text>
        </g>
      )}
      <path d={d} fill="none" stroke="#287BE8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {dots &&
        points.slice(0, -1).map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r="3" fill="#FFFFFF" stroke="#287BE8" strokeWidth="2" />
            <title>{`${p.x}: ${fmt(p.value)}`}</title>
          </g>
        ))}
      <circle cx={x(points.length - 1)} cy={y(lastP.value)} r="3.5" fill="#04102D" />
      {dots && <text x={x(points.length - 1)} y={y(lastP.value) - 7} textAnchor="end" fontSize={font} fill="#04102D" fontWeight="700">{fmt(lastP.value)}</text>}
    </svg>
  );
}

export function BarChart({ points, label }: { points: Point[]; label: string }) {
  if (points.length === 0) return null;
  const { W, H, PAD } = DIMS.full;
  const { min, max, y } = scale(points, true);
  const innerW = W - PAD.left - PAD.right;
  const slot = innerW / points.length;
  const bw = Math.max(1, slot * 0.7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <Axis min={min} max={max} y={y} first={points[0].x} last={points[points.length - 1].x} />
      {points.map((p, i) => (
        <rect
          key={p.x + i}
          x={PAD.left + i * slot + (slot - bw) / 2}
          y={y(p.value)}
          width={bw}
          height={Math.max(0, y(0) - y(p.value))}
          rx="1.5"
          fill="#287BE8"
        >
          <title>{`${p.x}: ${fmt(p.value)}`}</title>
        </rect>
      ))}
    </svg>
  );
}
