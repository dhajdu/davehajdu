'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Boarding-pass card for the next (or current) trip. The server works out
// which state applies; this island only ticks the countdown and the clock there.
// On the road it reads as today: the stub counts down to a flight leaving today,
// and the fields swap to check-out and leave-for-the-airport times.
export type PassProps = {
  href: string;
  title: string;
  purpose: string;
  place: string;
  from: { code: string; city: string };
  to: { code: string; city: string };
  targetMs: number;
  departDay: string;
  departTime: string | null;
  flight: string | null;
  duration: string | null;
  nights: number | null;
  hotel: string | null;
  checkout: { time: string; hotel: string } | null;
  leaveBy: { code: string; time: string; hours: number } | null;
  destTz: string | null;
  homeTz: string;
  code: string | null;
  onRoad: { day: number; of: number } | null;
  flightToday: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');

function offsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return (Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - at.getTime()) / 60_000;
}

function shift(destTz: string, homeTz: string, at: Date): string {
  const h = Math.round((offsetMinutes(destTz, at) - offsetMinutes(homeTz, at)) / 30) / 2;
  if (h === 0) return 'same as home';
  return `${h > 0 ? '+' : ''}${h}h vs home`;
}

// Bar widths derived from the confirmation code, so each pass looks its own.
function bars(code: string): number[] {
  return [...code.repeat(3)].flatMap((ch, i) => {
    const c = ch.charCodeAt(0) + i;
    return [(c % 3) + 1, ((c >> 1) % 3) + 1];
  });
}

export function NextTripPass(p: PassProps) {
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now == null ? null : Math.max(0, Math.floor((p.targetMs - now) / 1000));
  const days = left == null ? null : Math.floor(left / 86400);
  // Within a day the big number turns into hours and the clock keeps the minutes and seconds.
  const sameDay = left != null && days === 0;
  const big = left == null ? null : sameDay ? Math.floor(left / 3600) : days;
  const unit = sameDay ? (big === 1 ? 'hour' : 'hours') : big === 1 ? 'day' : 'days';
  const clock =
    left == null
      ? '--:--:--'
      : sameDay
        ? `${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`
        : `${pad(Math.floor((left % 86400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  // On the road the ring shows the day of the trip, except while a flight is still ahead today.
  const showRing = !!p.onRoad && !(p.flightToday && (left == null || left > 0));
  const there =
    now != null && p.destTz
      ? new Intl.DateTimeFormat('en-GB', { timeZone: p.destTz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
      : '--:--';

  async function copy() {
    if (!p.code) return;
    try {
      await navigator.clipboard.writeText(p.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const ringLen = 2 * Math.PI * 42;

  return (
    <article className="life-pass">
      <div className="life-pass-main">
        <div className="life-pass-top">
          <span className="life-pass-label">
            {p.onRoad ? 'On the road' : 'Next trip'} · {p.purpose}
          </span>
          <Link href={p.href} className="life-pass-title">
            {p.title}
          </Link>
        </div>

        <div className="life-pass-route">
          <div>
            <div className={`life-pass-code${p.from.code.length > 4 ? ' is-long' : ''}`}>{p.from.code}</div>
            <div className="life-pass-city">{p.from.city}</div>
          </div>
          <svg className="life-pass-path" viewBox="0 0 200 54" aria-hidden>
            <path d="M4 48 Q100 -14 196 48" />
            <circle r="3.5" className="life-pass-plane">
              <animateMotion dur="6s" repeatCount="indefinite" path="M4 48 Q100 -14 196 48" />
            </circle>
            <circle r="3.5" cx="100" cy="17" className="life-pass-plane-still" />
          </svg>
          <div className="text-right">
            <div className={`life-pass-code${p.to.code.length > 4 ? ' is-long' : ''}`}>{p.to.code}</div>
            <div className="life-pass-city">{p.to.city}</div>
          </div>
        </div>

        <dl className="life-pass-fields">
          <div>
            <dt>Depart</dt>
            <dd>
              {p.departDay}
              {p.departTime && <small>{p.departTime}</small>}
            </dd>
          </div>
          {p.flight && (
            <div>
              <dt>Flight</dt>
              <dd>
                {p.flight}
                {p.duration && <small>{p.duration}</small>}
              </dd>
            </div>
          )}
          {p.checkout ? (
            <div>
              <dt>Check out</dt>
              <dd>
                {p.checkout.time}
                <small className="truncate">{p.checkout.hotel}</small>
              </dd>
            </div>
          ) : (
            p.nights != null && (
              <div>
                <dt>Nights</dt>
                <dd>
                  {p.nights}
                  {p.hotel && <small className="truncate">{p.hotel}</small>}
                </dd>
              </div>
            )
          )}
          {p.leaveBy ? (
            <div>
              <dt>Leave for {p.leaveBy.code}</dt>
              <dd>
                {p.leaveBy.time}
                <small>{p.leaveBy.hours}h before wheels up</small>
              </dd>
            </div>
          ) : (
            p.destTz && (
              <div>
                <dt>{p.to.city} now</dt>
                <dd>
                  {there}
                  {now != null && <small>{shift(p.destTz, p.homeTz, new Date(now))}</small>}
                </dd>
              </div>
            )
          )}
        </dl>
      </div>

      <div className="life-pass-stub">
        {showRing && p.onRoad ? (
          <div>
            <div className="life-pass-stub-label">Today in {p.place}</div>
            <svg className="life-pass-ring" viewBox="0 0 100 100" role="img" aria-label={`Day ${p.onRoad.day} of ${p.onRoad.of}`}>
              <circle cx="50" cy="50" r="42" className="life-pass-ring-track" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="life-pass-ring-fill"
                strokeDasharray={ringLen}
                strokeDashoffset={ringLen * (1 - p.onRoad.day / p.onRoad.of)}
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="50" className="life-pass-ring-n">{p.onRoad.day}</text>
              <text x="50" y="67" className="life-pass-ring-of">of {p.onRoad.of}</text>
            </svg>
          </div>
        ) : (
          <div>
            <div className="life-pass-stub-label">{p.flight ? 'Wheels up in' : 'Leaving in'}</div>
            <div className="life-pass-days">
              {big ?? '–'}
              <span>{unit}</span>
            </div>
            <div className="life-pass-clock">{clock}</div>
          </div>
        )}
        {p.code && (
          <div className="life-pass-barcode">
            <div className="life-pass-bars" aria-hidden>
              {bars(p.code).map((w, i) => (
                <i key={i} style={{ width: w }} />
              ))}
            </div>
            <button type="button" onClick={copy} className="life-pass-copy" aria-label={`Copy confirmation code ${p.code}`}>
              {p.code}
              <em>{copied ? 'Copied' : 'Copy'}</em>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
