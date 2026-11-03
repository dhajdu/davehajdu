// Day-by-day itinerary. Every time is shown in the leg's own timezone.
import { Chip } from '@/components/life/ui';
import { CopyCode } from './CopyCode';
import { daysBetween, fmtDuration, localDateKey, localTime, placeCode } from './format';
import type { Leg, LegKind } from './types';

type Item = {
  key: string;
  day: string;
  at: number;
  leg: Leg;
  variant: 'move' | 'checkin' | 'checkout' | 'event';
};

const ICON: Record<LegKind, React.ReactNode> = {
  flight: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  hotel: <path d="M3 19V6m0 8h18v5m0-5v-2a3 3 0 00-3-3h-7v5M7 11h.01" />,
  train: <path d="M6 3h12a2 2 0 012 2v9a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2zM4 10h16M8 21l2-4m6 4l-2-4M8 14h.01M16 14h.01" />,
  car: <path d="M5 16h14v-4l-2-5H7l-2 5zM5 16v2m14-2v2M3 12h18M8 13.5h.01M16 13.5h.01" />,
  event: <path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v8a2 2 0 00-2 2H6a2 2 0 00-2-2zM10 6v12" />,
};

// Bars are scaled against a long-haul day so short hops look short.
const LONGEST_MIN = 14 * 60;
const MAX_DOTS = 14;

function buildItems(legs: Leg[]): Item[] {
  const items: Item[] = [];
  for (const leg of legs) {
    const start = { key: `${leg.id}-s`, day: localDateKey(leg.starts_at, leg.start_tz), at: Date.parse(leg.starts_at), leg };
    if (leg.kind === 'hotel') {
      items.push({ ...start, variant: 'checkin' });
      if (leg.ends_at) {
        items.push({
          key: `${leg.id}-e`,
          day: localDateKey(leg.ends_at, leg.end_tz ?? leg.start_tz),
          at: Date.parse(leg.ends_at),
          leg,
          variant: 'checkout',
        });
      }
    } else {
      items.push({ ...start, variant: leg.kind === 'event' ? 'event' : 'move' });
    }
  }
  return items.sort((a, b) => (a.day === b.day ? a.at - b.at : a.day < b.day ? -1 : 1));
}

function gmailUrl(leg: Leg): string | null {
  const s = leg.source;
  if (!s || s.sources?.slug !== 'gmail' || !s.external_id) return null;
  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(s.external_id)}`;
}

function ItemRow({ item, muted }: { item: Item; muted?: boolean }) {
  const { leg, variant } = item;
  const startTime = localTime(leg.starts_at, leg.start_tz);
  const endTz = leg.end_tz ?? leg.start_tz;
  const hotelName = leg.destination?.name ?? leg.provider ?? 'Hotel';

  let headline: React.ReactNode;
  let detail: string[] = [];
  if (variant === 'move') {
    const dayShift = leg.ends_at ? daysBetween(item.day, localDateKey(leg.ends_at, endTz)) : 0;
    headline = (
      <>
        {placeCode(leg.origin)} {startTime} → {placeCode(leg.destination)}
        {leg.ends_at && ` ${localTime(leg.ends_at, endTz)}`}
        {dayShift !== 0 && <sup className="ml-0.5 text-[10px] text-magenta">{dayShift > 0 ? `+${dayShift}` : dayShift}</sup>}
      </>
    );
    detail = [leg.number, leg.provider].filter((x): x is string => !!x);
  } else if (variant === 'checkin') {
    headline = `Check in · ${hotelName}`;
    detail = [`from ${startTime}`];
  } else if (variant === 'checkout') {
    headline = `Check out · ${hotelName}`;
    detail = [`by ${localTime(leg.ends_at!, endTz)}`];
  } else {
    headline = leg.provider ?? leg.destination?.name ?? 'Event';
    detail = [startTime, leg.destination?.name !== headline ? leg.destination?.name : null].filter(
      (x): x is string => !!x
    );
  }

  const first = variant !== 'checkout';
  const mail = gmailUrl(leg);

  const minutes = variant === 'move' && leg.ends_at ? (Date.parse(leg.ends_at) - Date.parse(leg.starts_at)) / 60_000 : 0;
  const nights = variant === 'checkin' && leg.ends_at ? daysBetween(item.day, localDateKey(leg.ends_at, endTz)) : 0;

  return (
    <li className={`life-stop is-${leg.kind} ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="life-stop-icon" aria-hidden>
          <svg viewBox="0 0 24 24">{ICON[leg.kind]}</svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-navy break-words ${muted ? 'line-through' : ''}`}>{headline}</p>
          {detail.length > 0 && <p className="text-sm text-body-text">{detail.join(' · ')}</p>}
          {variant === 'checkin' && leg.address && <p className="text-xs text-muted mt-0.5">{leg.address}</p>}
        </div>
      </div>
      {minutes > 0 && (
        <div className="life-stop-dur">
          <span>{placeCode(leg.origin)}</span>
          <span className="life-stop-bar">
            <i style={{ width: `${Math.min(100, Math.max(8, (minutes / LONGEST_MIN) * 100))}%` }} />
          </span>
          <span>{fmtDuration(leg.starts_at, leg.ends_at!)}</span>
        </div>
      )}
      {nights > 0 && (
        <div className="life-stop-nights">
          {Array.from({ length: Math.min(nights, MAX_DOTS) }, (_, i) => (
            <i key={i} />
          ))}
          <span>
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        </div>
      )}
      {(leg.status === 'changed' || (first && leg.confirmation_code)) && (
        <div className="flex flex-wrap items-center gap-2">
          {first && leg.confirmation_code && <CopyCode code={leg.confirmation_code} />}
          {leg.status === 'changed' && <Chip tone="blue">Changed</Chip>}
        </div>
      )}
      {first && leg.source && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted py-1">Source email</summary>
          <div className="mt-1 rounded-lg bg-light-gray p-2.5 space-y-0.5">
            <p className="font-semibold text-navy break-words">{leg.source.subject ?? '(no subject)'}</p>
            {leg.source.from && <p className="text-muted break-words">{leg.source.from}</p>}
            {mail && (
              <a href={mail} target="_blank" rel="noreferrer" className="inline-block text-blue font-semibold pt-1">
                Open in Gmail
              </a>
            )}
          </div>
        </details>
      )}
    </li>
  );
}

// The local day keys an itinerary would show, in order.
export function itineraryDays(legs: Leg[]): string[] {
  return [...new Set(buildItems(legs).map((i) => i.day))];
}

// `days` narrows the view to the days it accepts (today only, the rest of the trip).
export function Itinerary({ legs, muted, days: keep }: { legs: Leg[]; muted?: boolean; days?: (day: string) => boolean }) {
  const items = buildItems(legs).filter((i) => !keep || keep(i.day));
  const days: { day: string; items: Item[] }[] = [];
  for (const item of items) {
    const last = days[days.length - 1];
    if (last && last.day === item.day) last.items.push(item);
    else days.push({ day: item.day, items: [item] });
  }
  const showYear = new Set(days.map((d) => d.day.slice(0, 4))).size > 1;
  return (
    <ol className="life-itin">
      {days.map((d) => {
        const at = new Date(`${d.day}T00:00:00Z`);
        const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...o }).format(at);
        return (
          <li key={d.day} className="life-itin-day">
            <div className="life-itin-date">
              <div className="life-itin-dow">{part({ weekday: 'short' })}</div>
              <div className="life-itin-num">{part({ day: 'numeric' })}</div>
              <div className="life-itin-mon">
                {part({ month: 'short' })}
                {showYear && ` ${d.day.slice(2, 4)}`}
              </div>
            </div>
            <ul className="life-itin-stops">
              {d.items.map((item) => (
                <ItemRow key={item.key} item={item} muted={muted} />
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
