// Plain equirectangular world map: graticule plus pins, no tiles or library.
export type MapPin = { id: string; label: string; lat: number; lng: number; count: number; home: boolean };

const W = 360;
const H = 180;

export function WorldMap({ pins }: { pins: MapPin[] }) {
  const max = Math.max(1, ...pins.map((p) => p.count));
  const radius = (n: number) => 1.6 + 3.4 * Math.sqrt(n / max);
  const ordered = [...pins].sort((a, b) => b.count - a.count || Number(a.home) - Number(b.home));
  const lngs = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const lats = [-60, -30, 0, 30, 60];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl" role="img" aria-label={`Map of ${pins.length} places`}>
      <rect width={W} height={H} fill="#EAEEF2" />
      {lngs.map((lng) => (
        <line key={`x${lng}`} x1={lng + 180} x2={lng + 180} y1={0} y2={H} stroke="#D4D9E0" strokeWidth={lng === 0 ? 0.5 : 0.3} />
      ))}
      {lats.map((lat) => (
        <line key={`y${lat}`} x1={0} x2={W} y1={90 - lat} y2={90 - lat} stroke="#D4D9E0" strokeWidth={lat === 0 ? 0.5 : 0.3} />
      ))}
      {ordered.map((p) => (
        <circle
          key={p.id}
          cx={p.lng + 180}
          cy={90 - p.lat}
          r={radius(p.count)}
          fill={p.home ? '#D1458B' : '#287BE8'}
          fillOpacity={p.home ? 1 : 0.85}
          stroke="#FFFFFF"
          strokeWidth={0.5}
        >
          <title>{`${p.label} · ${p.count} ${p.count === 1 ? 'visit' : 'visits'}`}</title>
        </circle>
      ))}
    </svg>
  );
}
