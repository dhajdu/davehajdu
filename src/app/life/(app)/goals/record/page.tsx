import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { GoalsTabs } from '@/components/life/goals/GoalsTabs';
import { Achieved, MonthCard, YearStrip } from '@/components/life/goals/Record';
import { getFocus, getLongGoals, getPastGoals } from '@/lib/life/focus';
import { getMonthReviews } from '@/lib/life/month-review';
import { buildRecord } from '@/lib/life/record';
import { currentPeriod, ictToday } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Track record', robots: { index: false, follow: false } };

export default async function GoalsRecordPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const period = currentPeriod();
  const year = today.slice(0, 4);

  const [focus, goals, past, reviews] = await Promise.all([getFocus(supabase, today), getLongGoals(supabase), getPastGoals(supabase, period), getMonthReviews(supabase)]);
  const records = buildRecord(past, focus.history, reviews, period);
  const achieved = goals.filter((g) => g.horizon === 'year' && g.status === 'hit');

  return (
    <div className="max-w-5xl">
      <PageHeader title="Goals" subtitle="How the months went: what landed, what slipped, and the grades I gave them." />
      <GoalsTabs active="record" />

      <section className="life-record-hero">
        <div>
          <span className="life-ladder-title">{year}, month by month</span>
          <YearStrip year={year} records={records} period={period} />
        </div>
        <div>
          <span className="life-ladder-title">Achieved this year</span>
          <Achieved rows={achieved} />
        </div>
      </section>

      <section className="life-section">
        <div className="life-section-head">
          <h2 className="life-section-title">Month by month</h2>
          <span className="life-section-sub">Goals set in the app, the journal&apos;s Historical block, and the month-end grades</span>
        </div>
        {records.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No past months on record yet.</p>
          </Card>
        ) : (
          <div className="life-record">
            {records.map((r, i) => (
              <MonthCard key={r.period} r={r} open={i === 0} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
