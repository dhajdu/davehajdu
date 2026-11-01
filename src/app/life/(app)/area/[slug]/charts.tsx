// Hand-written SVG charts. Token hexes only: navy #04102D, blue #287BE8,
// border #D4D9E0, muted #6B7280.

type Point = { x: string; value: number };

const W = 600;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 22, left: 40 };

function scale(points: Point[], zeroBased: boolean) {
  const vals = points.map((p) => p.value);
  let min = zeroBased ? 0 : Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) {
    min = zeroBased ? 0 : min - 1;
    max = max + 1;
  }
  const pad = zeroBased ? 0 : (max - min) * 0.1;
  min -= pad;
  max += pad;
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;
  return { min, max, y };
}

function fmt(v: number) {
  return Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v * 10) / 10);
}

function Axis({ min, max, y, first, last }: { min: number; max: number; y: (v: number) => number; first: string; last: string }) {
  const ticks = [min, (min + max) / 2, max];
  return (
    <g fontSize="10" fill="#6B7280">
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

export function LineChart({ points, label }: { points: Point[]; label: string }) {
  if (points.length === 0) return null;
  const { min, max, y } = scale(points, false);
  const innerW = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const lastP = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <Axis min={min} max={max} y={y} first={points[0].x} last={lastP.x} />
      <path d={d} fill="none" stroke="#287BE8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(lastP.value)} r="3.5" fill="#04102D" />
    </svg>
  );
}

export function BarChart({ points, label }: { points: Point[]; label: string }) {
  if (points.length === 0) return null;
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
