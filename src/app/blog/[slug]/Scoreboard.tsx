import { GOAL, type ScoreDay } from '@/lib/blog/scoreboard';

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
const cpl = (d: ScoreDay) => (d.leads ? usd(d.adSpendUsd / d.leads) : '—');

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">{label}</p>
      <p className="mt-1.5 text-[26px] md:text-[30px] font-black leading-none text-white tabular-nums">{value}</p>
      {note && <p className="mt-1.5 text-[12px] text-white/50">{note}</p>}
    </div>
  );
}

export default function Scoreboard({ days }: { days: ScoreDay[] }) {
  const today = days[days.length - 1];
  const daysLeft = Math.round((Date.parse(`${GOAL.by}T00:00:00Z`) - Date.parse(`${today.date}T00:00:00Z`)) / 86_400_000);
  const sum = (f: (d: ScoreDay) => number) => days.reduce((n, d) => n + f(d), 0);
  const total = {
    visits: sum((d) => d.visits),
    leads: sum((d) => d.leads),
    adSpendUsd: sum((d) => d.adSpendUsd),
    websiteSalesUsd: sum((d) => d.websiteSalesUsd),
    books: today.booksTotal,
  };
  const pct = Math.min(100, (today.paidMembers / GOAL.paidMembers) * 100);

  return (
    <section aria-label="Scoreboard" className="not-prose my-12 lg:-mx-28 rounded-3xl bg-[#04102D] p-5 md:p-8 text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6FF2C1]">The scoreboard · Day {today.day}</p>
        <p className="text-[12px] text-white/50">From the 5:15 report for {fmtDate(today.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      {/* Goal */}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[15px] md:text-[17px] font-semibold">
            <span className="text-[34px] md:text-[44px] font-black tabular-nums leading-none mr-2">{today.paidMembers}</span>
            <span className="text-white/60">of {GOAL.paidMembers} paid members by {GOAL.label}</span>
          </p>
          <p className="text-[13px] text-white/60 tabular-nums">{daysLeft} days to go</p>
        </div>
        <div
          className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={GOAL.paidMembers}
          aria-valuenow={today.paidMembers}
          aria-label="Paid members"
        >
          <div className="h-full rounded-full bg-[#6FF2C1]" style={{ width: `${Math.max(pct, 1)}%` }} />
        </div>
      </div>

      {/* This day, and the total since launch */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Tile label="Visits" value={today.visits.toLocaleString('en-US')} note={`${total.visits.toLocaleString('en-US')} total`} />
        <Tile label="Leads" value={String(today.leads)} note={`${total.leads} total · ${cpl(today)} each`} />
        <Tile label="Ad spend" value={usd(today.adSpendUsd)} note={`${usd(total.adSpendUsd)} total`} />
        <Tile label="Website sales" value={usd(today.websiteSalesUsd)} note={`${usd(total.websiteSalesUsd)} total`} />
        <div className="col-span-2 md:col-span-1">
          <Tile label="Books on Amazon" value={String(today.books)} note={`${total.books} total`} />
        </div>
      </div>
    </section>
  );
}
