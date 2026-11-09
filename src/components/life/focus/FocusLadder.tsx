import Link from 'next/link';
import { TRACKS, type Focus, type GoalRow, type Track } from '@/lib/life/focus';
import { addDays, formatDate, weekOfMonth } from '@/lib/life/metrics';
import { SaveButton } from '@/components/life/SaveButton';
import { setOneThing } from '@/app/life/(app)/journal/[date]/actions';
import { setFocusGoal } from '@/app/life/(app)/goals/actions';
import { StatusMark } from './StatusMark';
import { LadderGoal } from './LadderGoal';
import { LadderThing } from './LadderThing';

// The question the app answers, as one ladder with two tracks: health (the
// foundation) and business. Today, this week, this month, this year, five
// years, each with one of each. A rung that is not filled in yet is empty and
// takes the answer right here. Today lives in the journal; the week and the
// month are goals; the year and the vision come from the goals page.

// Journal lines carry no track, so guess from the words.
function guessTrack(text: string): Track {
  return /\b(health|sleep|gym|workout|exercise|train|walk|run|yoga|tennis|swim|sugar|carb|diet|fast|weight|kg|bedtime|recovery|hrv|blood|doctor|medic)/i.test(text) ? 'health' : 'business';
}

function Tracks({ children }: { children: (track: Track) => React.ReactNode }) {
  return (
    <div className="life-rung-tracks">
      {TRACKS.map((t) => (
        <div key={t.key} className={`life-track is-${t.key}`}>
          <span className="life-track-head">{t.label}</span>
          {children(t.key)}
        </div>
      ))}
    </div>
  );
}

function GoalLines({ rows }: { rows: GoalRow[] }) {
  return rows.map((g) => <LadderGoal key={g.id} goal={g} />);
}

function FocusForm({ horizon, period, track, placeholder }: { horizon: 'week' | 'month'; period: string; track: Track; placeholder: string }) {
  return (
    <form action={setFocusGoal} className="life-rung-form">
      <input type="hidden" name="horizon" value={horizon} />
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="track" value={track} />
      <input name="title" required maxLength={200} placeholder={placeholder} aria-label={placeholder} autoComplete="off" />
      <SaveButton>Set</SaveButton>
    </form>
  );
}

export function FocusLadder({ focus, goals, today, week }: { focus: Focus; goals: GoalRow[]; today: string; week: string }) {
  const year = today.slice(0, 4);
  const period = today.slice(0, 7);
  const short = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
  const monthName = new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });

  // Only today's own One Things count as today's.
  const oneThing = focus.oneThing?.date === today ? focus.oneThing : null;

  // The journal's ❸ block only speaks for the month it names.
  const journalMonth = focus.month && focus.month.month.trim().toLowerCase() === monthName.toLowerCase() ? focus.month : null;
  const dayOfMonth = Number(today.slice(8, 10));
  const weekNo = Math.min(5, Math.ceil(dayOfMonth / 7));
  const journalWeek = journalMonth?.weeks.find((w) => w.week === weekNo) ?? null;
  const journalGoals = journalMonth ? (journalMonth.goals.length ? journalMonth.goals : journalMonth.moves) : [];

  const of = (horizon: GoalRow['horizon'], track: Track, p?: string) => goals.filter((g) => g.horizon === horizon && g.track === track && (p === undefined || g.period === p));
  const noun = (track: Track) => (track === 'health' ? 'for my health' : 'for the business');

  return (
    <section className="life-ladder" aria-label="The one thing">
      <div className="life-ladder-head">
        <span className="life-ladder-title">The one thing</span>
        <span className="life-ladder-q">Am I living the life I intend to live?</span>
      </div>
      <div className="life-rungs">
        <div className="life-rung is-now">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            Today
            <small>{short(today)}</small>
          </span>
          <div className="life-rung-body">
            <Tracks>
              {(track) => {
                const text = track === 'health' ? oneThing?.health : oneThing?.business;
                return text ? (
                  <LadderThing date={today} track={track} text={text} />
                ) : (
                  <form action={setOneThing} className="life-rung-form">
                    <input type="hidden" name="date" value={today} />
                    <input type="hidden" name="track" value={track} />
                    <input name="one_thing" required maxLength={300} placeholder={`The one thing ${noun(track)} today`} aria-label={`The one thing ${noun(track)} today`} autoComplete="off" />
                    <SaveButton>Set</SaveButton>
                  </form>
                );
              }}
            </Tracks>
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            Week {weekOfMonth(week)}
            <small>{short(week)} to {short(addDays(week, 6))}</small>
          </span>
          <div className="life-rung-body">
            <Tracks>
              {(track) => {
                const rows = of('week', track, week);
                if (rows.length) return <GoalLines rows={rows} />;
                if (journalWeek && guessTrack(journalWeek.text) === track) {
                  return (
                    <p className={`life-rung-item is-${journalWeek.status}`}>
                      <StatusMark status={journalWeek.status} />
                      <span>{journalWeek.text}</span>
                    </p>
                  );
                }
                return <FocusForm horizon="week" period={week} track={track} placeholder={`The one thing ${noun(track)} this week`} />;
              }}
            </Tracks>
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            {monthName}
            <small>this month</small>
          </span>
          <div className="life-rung-body">
            <Tracks>
              {(track) => {
                const rows = of('month', track, period);
                if (rows.length) return <GoalLines rows={rows} />;
                const lines = journalGoals.filter((g) => guessTrack(g.text) === track);
                if (lines.length) {
                  return lines.map((g, i) => (
                    <p key={i} className={`life-rung-item is-${g.status}`}>
                      <StatusMark status={g.status} />
                      <span>{g.text}</span>
                    </p>
                  ));
                }
                return <FocusForm horizon="month" period={period} track={track} placeholder={`The one thing ${noun(track)} in ${monthName}`} />;
              }}
            </Tracks>
            <p className="life-rung-empty">
              More goals for {monthName}: <Link href="/life/goals">the goals page</Link>
            </p>
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            {year}
            <small>this year</small>
          </span>
          <div className="life-rung-body">
            <Tracks>
              {(track) => {
                const rows = of('year', track);
                return rows.length ? (
                  <GoalLines rows={rows} />
                ) : (
                  <p className="life-rung-empty">
                    Nothing {noun(track)} yet. <Link href="/life/goals">Set it</Link>
                  </p>
                );
              }}
            </Tracks>
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            Five years
            <small>by {Number(year) + 5}</small>
          </span>
          <div className="life-rung-body">
            {focus.vision?.statement ? (
              <p className="life-rung-text">{focus.vision.statement}</p>
            ) : (
              <p className="life-rung-empty">No vision statement yet.</p>
            )}
            <p className="life-rung-empty">
              <a href="#vision">The whole picture and the core values, below</a> · <Link href="/life/goals">the goals page</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
