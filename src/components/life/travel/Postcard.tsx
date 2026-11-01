import Link from 'next/link';
import { HOME_LATLNG, LAND, arcPath, project } from './geo';
import { fmtRange, purposeLabel } from './format';
import type { Trip } from './types';

// Card for a later trip: days away plus a dot-map crop of home and the destination.
export function Postcard({ trip, daysAway }: { trip: Trip; daysAway: number }) {
  const dest = trip.primary?.lat != null && trip.primary.lng != null ? { lat: trip.primary.lat, lng: trip.primary.lng } : null;
  const [hx, hy] = project(HOME_LATLNG.lng, HOME_LATLNG.lat);
  const [tx, ty] = dest ? project(dest.lng, dest.lat) : [hx, hy];
  const cx = (hx + tx) / 2;
  const cy = (hy + ty) / 2;
  const span = Math.max(80, Math.abs(tx - hx) * 1.5, Math.abs(ty - hy) * 3.2);
  const h = span * 0.42;
  const r = (span / 220) * 1.4;
  const dots = LAND.map(([lng, lat]) => project(lng, lat))
    .filter(([x, y]) => Math.abs(x - cx) < span / 2 + 4 && Math.abs(y - cy) < h / 2 + 4)
    .map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)}h0`)
    .join('');
  const city = trip.primary?.city ?? trip.primary?.name ?? trip.title;

  return (
    <li className="life-postcard">
      <Link href={`/life/travel/${trip.id}`} className="block">
        <div className="life-postcard-art">
          <svg viewBox={`${cx - span / 2} ${cy - h / 2} ${span} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
            <path d={dots} className="life-dots" strokeWidth={r * 2} />
            {dest && <path d={arcPath(HOME_LATLNG, dest)} className="life-postcard-arc" strokeWidth={r * 0.9} strokeDasharray={`${r * 2} ${r * 1.5}`} />}
            <circle cx={hx} cy={hy} r={r * 2.2} className="life-home-dot" />
            {dest && <circle cx={tx} cy={ty} r={r * 2.2} className="life-pin-dot" />}
          </svg>
          <span className={`life-postcard-stamp ${trip.purpose === 'business' ? 'is-business' : ''}`}>{purposeLabel[trip.purpose]}</span>
        </div>
        <div className="life-postcard-body">
          <div className="life-postcard-away">
            {daysAway}
            <span>{daysAway === 1 ? 'day away' : 'days away'}</span>
          </div>
          <p className="life-postcard-city">{trip.title}</p>
          <p className="life-postcard-when">{city !== trip.title ? `${city} · ` : ''}{fmtRange(trip.start_on, trip.end_on)}</p>
        </div>
      </Link>
    </li>
  );
}
