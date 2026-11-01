// Day-by-day itinerary. Every time is shown in the leg's own timezone.
import { Chip } from '@/components/life/ui';
import { CopyCode } from './CopyCode';
import { daysBetween, fmtDay, localDateKey, localTime, placeCode } from './format';
import type { Leg, LegKind } from './types';

type Item = {
  key: string;
  day: string;
  at: number;
  leg: Leg;
  variant: 'move' | 'checkin' | 'checkout' | 'event';
};

const ICON: Record<LegKind, string> = { flight: '✈', hotel: 'H', train: 'T', car: 'C', event: 'E' };

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

  return (
    <li className={`flex gap-3 py-3 ${muted ? 'opacity-70' : ''}`}>
      <div
        aria-hidden
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
          leg.kind === 'flight' ? 'bg-blue text-white' : 'bg-light-gray text-navy'
        }`}
      >
        {ICON[leg.kind]}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-navy break-words ${muted ? 'line-through' : ''}`}>{headline}</p>
        {detail.length > 0 && <p className="text-sm text-body-text">{detail.join(' · ')}</p>}
        {variant === 'checkin' && leg.address && <p className="text-xs text-muted mt-0.5">{leg.address}</p>}
        {(leg.status === 'changed' || (first && leg.confirmation_code)) && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {first && leg.confirmation_code && <CopyCode code={leg.confirmation_code} />}
            {leg.status === 'changed' && <Chip tone="blue">Changed</Chip>}
          </div>
        )}
        {first && leg.source && (
          <details className="mt-1.5 text-xs">
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
      </div>
    </li>
  );
}

export function Itinerary({ legs, muted }: { legs: Leg[]; muted?: boolean }) {
  const items = buildItems(legs);
  const days: { day: string; items: Item[] }[] = [];
  for (const item of items) {
    const last = days[days.length - 1];
    if (last && last.day === item.day) last.items.push(item);
    else days.push({ day: item.day, items: [item] });
  }
  const showYear = new Set(days.map((d) => d.day.slice(0, 4))).size > 1;
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <section key={d.day}>
          <h3 className="text-xs font-semibold text-muted border-b border-border pb-1">{fmtDay(d.day, showYear)}</h3>
          <ul className="divide-y divide-border">
            {d.items.map((item) => (
              <ItemRow key={item.key} item={item} muted={muted} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
