'use client';
import { useMemo, useState } from 'react';
import { LAND, MAP_H, MAP_W, arcPath, km, project, type LatLng } from './geo';

// Dot-matrix world with an arc per route flown, filterable by year.
export type MapPin = { id: string; label: string; code: string; lat: number; lng: number; byYear: Record<string, number>; home: boolean };
export type MapArc = { key: string; from: LatLng; to: LatLng; year: string; business: boolean; count: number; trips: string[] };

const ALL = 'All';

export function WorldMap({ pins, arcs }: { pins: MapPin[]; arcs: MapArc[] }) {
  const years = useMemo(() => [...new Set(arcs.map((a) => a.year))].sort(), [arcs]);
  const [year, setYear] = useState(ALL);

  const shown = arcs.filter((a) => year === ALL || a.year === year);
  const counted = pins
    .map((p) => ({ ...p, count: year === ALL ? Object.values(p.byYear).reduce((n, c) => n + c, 0) : (p.byYear[year] ?? 0) }))
    .filter((p) => p.home || p.count > 0);
  const max = Math.max(1, ...counted.map((p) => p.count));
  const trips = new Set(shown.flatMap((a) => a.trips)).size;
  const distance = shown.reduce((n, a) => n + km(a.from, a.to) * a.count, 0);
  const places = counted.filter((p) => !p.home).length;

  // Each dot is a zero-length round-capped segment, so the whole land layer is two paths.
  const dots = useMemo(() => {
    const near = pins.filter((p) => !p.home).map((p) => project(p.lng, p.lat));
    let cold = '';
    let hot = '';
    for (const [lng, lat] of LAND) {
      const [x, y] = project(lng, lat);
      const seg = `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
      if (near.some(([nx, ny]) => Math.hypot(nx - x, ny - y) < 14)) hot += seg;
      else cold += seg;
    }
    return { cold, hot };
  }, [pins]);

  return (
    <div className="life-map">
      <div className="life-map-bar">
        <p className="life-map-stat">
          <b>{trips}</b> trips · <b>{places}</b> places · <b>{Math.round(distance).toLocaleString('en-US')}</b> km
        </p>
        {years.length > 1 && (
          <div className="life-seg" role="group" aria-label="Year">
            {[ALL, ...years].map((y) => (
              <button key={y} type="button" aria-pressed={y === year} onClick={() => setYear(y)}>
                {y}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="life-map-svg" role="img" aria-label={`Map of ${places} places`}>
          <path d={dots.cold} className="life-dots" />
          <path d={dots.hot} className="life-dots is-hot" />
          <g key={year}>
            {shown.map((a, i) => (
              <path
                key={a.key}
                d={arcPath(a.from, a.to)}
                pathLength={1}
                className={`life-arc${a.business ? ' is-business' : ''}`}
                style={{ animationDelay: `${Math.min(i * 40, 1600)}ms`, strokeWidth: 1 + Math.min(a.count - 1, 4) * 0.35 }}
              />
            ))}
          </g>
          {counted.map((p) => {
            const [x, y] = project(p.lng, p.lat);
            return p.home ? (
              <g key={p.id}>
                <circle cx={x} cy={y} r={3} className="life-map-pulse" />
                <circle cx={x} cy={y} r={3.6} className="life-home-dot">
                  <title>{`${p.label} · home`}</title>
                </circle>
              </g>
            ) : (
              <g key={p.id}>
                <circle cx={x} cy={y} r={1.8 + 3 * Math.sqrt(p.count / max)} className="life-pin-dot">
                  <title>{`${p.label} · ${p.count} ${p.count === 1 ? 'trip' : 'trips'}`}</title>
                </circle>
                {p.count / max > 0.25 && (
                  <text x={x + 6} y={y + 3} className="life-map-label">
                    {p.code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="life-map-legend">
        <span><i className="is-home" />Home</span>
        <span><i />Personal</span>
        <span><i className="is-business" />Business</span>
        <span>Bigger dot means more trips</span>
      </p>
    </div>
  );
}
