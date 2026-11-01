// Dot-matrix world for travel maps. LAND_ROWS is a 2-degree land grid from
// world-atlas land-110m (lat 82 to -56, lng -179 to 179), each row run-length
// encoded in base36 as alternating sea/land counts, starting with sea.
const STEP = 2;
const LAT0 = 82;
const LNG0 = -179;
const LAND_ROWS: string[] = ["19.d.2.3.1.d.1.1.2t", "16.4.1.8.1.p.h.6.w.4.14", "y.1.4.1.1.1.5.4.2.r.h.2.2.1.26", "t.1.2.2.1.2.2.2.2.2.f.k.14.3.e.1.1.8.c.2.j", "s.4.b.1.i.i.11.2.e.c.z", "r.3.1.7.2.2.3.8.9.g.12.2.6.2.1.3.1.n.6.5.f", "9.a.5.1.1.1.4.9.2.2.3.3.1.5.7.g.l.5.j.2.1.17.5.1.4", "0.2.5.p.4.3.2.5.1.2.4.4.6.b.o.c.2.1.2.1t", "1.4.1.15.6.3.1.2.4.9.6.1.1.3.d.b.3.1y", "a.z.2.1.1.1.4.3.7.6.9.3.d.5.1.7.1.1y.1", "7.10.8.3.b.4.o.6.2.1y.1.6.2", "8.8.3.o.8.4.2.1.z.6.2.1.3.1q.4.2.7", "b.2.a.l.7.8.s.1.8.2.4.1m.9.2.9", "a.1.d.m.6.8.r.1.6.1.1.1.4.1m.9.3.9", "n.1.1.o.1.b.o.2.2.1.4.1u.8.2.a", "q.n.2.b.n.1.1.4.1.1y.6.1.b", "q.1.1.t.4.1.s.1y.1.1.i", "t.s.3.4.o.20.k", "s.u.1.1.t.g.4.5.3.16.l", "s.r.2.1.v.5.1.1.2.6.6.4.1.17.3.2.h", "s.r.u.7.2.1.1.2.2.4.3.1.3.3.2.13.5.1.j", "s.p.w.5.4.1.5.1.2.c.2.x.1.3.6.1.j", "t.n.y.4.6.2.3.1.1.c.2.w.3.2.q", "t.n.12.5.d.16.3.2.3.2.k", "v.k.z.9.d.16.5.2.n", "w.i.z.d.2.2.5.18.4.1.o", "w.1.1.b.2.2.10.t.1.10.t", "x.9.7.1.y.n.1.6.2.z.t", "z.6.8.1.x.o.1.7.4.v.u", "10.5.15.q.1.a.5.p.1.1.t", "11.4.9.1.v.q.2.a.5.a.1.b.x", "11.5.3.1.5.2.t.r.1.9.7.7.3.7.11", "13.7.5.1.4.1.p.r.2.7.9.5.5.6.7.1.t", "15.1.1.3.10.s.1.5.b.3.7.1.1.5.6.1.t", "18.4.y.t.1.2.d.3.9.6.5.2.s", "1b.1.y.u.3.1.c.2.9.1.1.4.7.1.r", "1b.1.4.7.o.w.d.2.9.1.2.1.6.1.1.1.s", "1d.1.1.9.n.w.f.1.8.1.b.2.r", "1f.a.1.1.m.6.1.m.q.1.7.1.3.1.r", "1f.d.u.k.o.1.1.2.5.2.v", "1f.e.u.i.q.3.4.3.v", "1e.f.u.g.t.2.3.4.v", "1e.i.r.g.t.2.3.3.2.1.5.1.1.2.k", "1d.m.p.e.v.2.4.1.8.6.4.1.d", "1d.n.o.d.y.1.f.6.2.1.c", "1e.n.o.d.z.2.c.3.1.1.5.1.a", "1f.l.p.d.1i.1.f", "1f.k.q.d.1a.1.4.1.i", "1g.j.p.e.4.1.12.1.1.3.3.1.i", "1h.i.p.e.3.2.11.7.2.2.h", "1j.f.q.c.4.3.10.c.h", "1j.f.q.b.5.2.10.e.g", "1j.e.s.b.4.2.x.i.f", "1j.c.u.b.4.2.x.j.e", "1j.b.v.9.15.k.d", "1i.c.w.8.15.k.d", "1i.b.y.6.17.j.d", "1i.a.z.6.17.6.2.a.e", "1i.9.10.2.1b.2.9.7.e", "1i.7.2r.5.f", "1h.8.2r.2.1.1.d.2.1", "1h.6.3a.1.2", "1h.5.2x.1.c.1.3", "1h.4.39.2.4", "1h.3.39.2.5", "1g.5.3f", "1g.4.3g", "1g.4.3.2.3b", "1h.3.3g", "50"];

export const LAND: [lng: number, lat: number][] = [];
LAND_ROWS.forEach((row, r) => {
  let c = 0;
  let land = false;
  for (const run of row.split('.')) {
    const n = parseInt(run, 36);
    if (land) for (let i = 0; i < n; i++) LAND.push([LNG0 + (c + i) * STEP, LAT0 - r * STEP]);
    c += n;
    land = !land;
  }
});

// Equirectangular, centred on 115°E so Saigon sits mid-map and the Pacific stays whole.
export const MAP_W = 720;
export const MAP_H = 288;
const CENTER = 115;

export function project(lng: number, lat: number): [number, number] {
  const d = ((lng - CENTER + 540) % 360) - 180;
  return [(d + 180) * (MAP_W / 360), (LAT0 - lat) * (MAP_W / 360) + 4];
}

export type LatLng = { lat: number; lng: number };

// Quadratic arc bowed upward, in projected coordinates.
export function arcPath(a: LatLng, b: LatLng): string {
  const [x1, y1] = project(a.lng, a.lat);
  const [x2, y2] = project(b.lng, b.lat);
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.32;
  const f = (n: number) => n.toFixed(1);
  return `M${f(x1)} ${f(y1)} Q${f((x1 + x2) / 2)} ${f((y1 + y2) / 2 - lift)} ${f(x2)} ${f(y2)}`;
}

export function km(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const EARTH_KM = 40_075;
export const HOME_LATLNG: LatLng = { lat: 10.82, lng: 106.65 }; // SGN
