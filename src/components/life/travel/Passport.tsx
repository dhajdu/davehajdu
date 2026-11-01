import { EARTH_KM } from './geo';

// Past-travel extras: distance in Earth laps, a stamp per country, a weekly away strip per year.
export type Stamp = { country: string; code: string | null; first: string; visits: number };
export type AwayWeek = { away: number; business: number; current: boolean };
export type AwayYear = { year: string; weeks: AwayWeek[] };

const INKS = ['is-blue', 'is-magenta', 'is-navy', 'is-green'];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function stampDate(key: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: '2-digit' })
    .format(new Date(`${key}T00:00:00Z`))
    .toUpperCase();
}

export function EarthLaps({ km, since }: { km: number; since: string | null }) {
  const laps = km / EARTH_KM;
  const ring = 2 * Math.PI * 17;
  return (
    <div className="life-earth">
      <svg viewBox="0 0 46 46" aria-hidden>
        <circle cx="23" cy="23" r="17" className="life-earth-track" />
        <circle cx="23" cy="23" r="17" className="life-earth-fill" strokeDasharray={`${(laps % 1) * ring} ${ring}`} transform="rotate(-90 23 23)" />
        <circle cx="23" cy="23" r="9" className="life-earth-core" />
      </svg>
      <div className="min-w-0">
        <p>
          <b>{laps.toFixed(1)}×</b> around the Earth
        </p>
        <p className="life-earth-sub">
          {Math.round(km).toLocaleString('en-US')} km flown{since ? ` since ${since}` : ''}. The next lap closes in{' '}
          {Math.round((Math.floor(laps) + 1 - laps) * EARTH_KM).toLocaleString('en-US')} km.
        </p>
      </div>
    </div>
  );
}

export function Stamps({ stamps }: { stamps: Stamp[] }) {
  return (
    <ul className="life-stamps">
      {stamps.map((s, i) => (
        <li key={s.country} className={`life-stamp ${INKS[i % INKS.length]}`} style={{ rotate: `${((i * 37) % 9) - 4}deg` }}>
          <span className="life-stamp-code">{s.code ? `${s.code} · ` : ''}Arrived</span>
          <span className="life-stamp-name">{s.country}</span>
          <span className="life-stamp-date">{stampDate(s.first)}</span>
          <span className="life-stamp-visits">
            {s.visits} {s.visits === 1 ? 'visit' : 'visits'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AwayStrip({ years }: { years: AwayYear[] }) {
  return (
    <div className="life-away">
      <div className="life-away-row">
        <span />
        <div className="life-away-months">
          {MONTHS.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
      {years.map((y) => (
        <div key={y.year} className="life-away-row">
          <span className="life-away-year">{y.year}</span>
          <div className="life-away-weeks">
            {y.weeks.map((w, i) => (
              <i
                key={i}
                title={`${y.year} week ${i + 1}: ${w.away} ${w.away === 1 ? 'night' : 'nights'} away`}
                className={[
                  w.away === 0 ? '' : w.business > w.away / 2 ? 'is-business' : w.away > 4 ? 'is-3' : w.away > 2 ? 'is-2' : 'is-1',
                  w.current ? 'is-now' : '',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="life-away-legend">
        <span><i className="is-1" />Away a night or two</span>
        <span><i className="is-3" />Away most of the week</span>
        <span><i className="is-business" />Mostly business</span>
      </p>
    </div>
  );
}
