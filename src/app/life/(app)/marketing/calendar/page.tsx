import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { PageHeader } from '@/components/life/ui';
import { MarketingTabs } from '@/components/life/marketing/MarketingTabs';
import { StatusChip } from '@/components/life/marketing/PostChip';
import { addDays, formatDate, ictToday, weekStart } from '@/lib/life/metrics';
import { ictDate } from '@/lib/blog/marketing';
import { POST_STATUSES, STATUS_LABEL, type PostStatus } from '@/lib/blog/publish';

export const metadata: Metadata = { title: 'Marketing calendar', robots: { index: false, follow: false } };

type Row = { id: string; title: string; status: PostStatus; scheduled_for: string | null; published_at: string | null };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function shiftMonth(month: string, by: number) {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

function Month({ posts, month }: { posts: Row[]; month: string }) {
  const today = ictToday();
  const days: string[] = [];
  let d = weekStart(`${month}-01`);
  const lastMonday = weekStart(addDays(`${shiftMonth(month, 1)}-01`, -1));
  while (d <= addDays(lastMonday, 6)) {
    days.push(d);
    d = addDays(d, 1);
  }
  const on = (day: string) => posts.filter((p) => {
    const when = p.scheduled_for ?? p.published_at;
    return when && ictDate(when) === day;
  });

  return (
    <div className="life-mk-scroll">
      <div className="life-mk-month">
        {DOW.map((n) => <div className="life-mk-dow" key={n}>{n}</div>)}
        {days.map((day) => (
          <div key={day} className={`life-mk-day${day.startsWith(month) ? '' : ' is-out'}${day === today ? ' is-today' : ''}`}>
            <div className="life-mk-date">{Number(day.slice(8))}</div>
            {on(day).map((p) => (
              <Link key={p.id} href={`/life/marketing/posts/${p.id}`} className={`life-mk-event is-${p.status}`}>{p.title}</Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Board({ posts }: { posts: Row[] }) {
  return (
    <div className="life-mk-scroll">
      <div className="life-mk-board">
        {POST_STATUSES.map((s) => {
          const rows = posts.filter((p) => p.status === s);
          return (
            <section key={s} className="life-mk-col">
              <h2 className="life-mk-col-head">{STATUS_LABEL[s]} <span>{rows.length}</span></h2>
              {rows.map((p) => {
                const when = p.scheduled_for ?? p.published_at;
                return (
                  <Link key={p.id} href={`/life/marketing/posts/${p.id}`} className="life-mk-card">
                    <span className="life-mk-card-title">{p.title}</span>
                    {when && <span className="text-xs text-muted">{formatDate(ictDate(when), { month: 'short', day: 'numeric' })}</span>}
                    {s === 'scheduled' && <StatusChip status={s} />}
                  </Link>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; month?: string }> }) {
  const { supabase } = await requireOwner();
  const { view, month: monthParam } = await searchParams;
  const isMonth = view === 'month';
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : ictToday().slice(0, 7);
  const { data, error } = await supabase.from('posts').select('id, title, status, scheduled_for, published_at').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  const posts = (data ?? []) as Row[];
  const href = (m: string) => `/life/marketing/calendar?view=month&month=${m}`;

  return (
    <div className="max-w-6xl">
      <PageHeader title="Calendar" subtitle="Scheduled posts go live at 8am Vietnam time." />
      <MarketingTabs active="calendar" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="life-seg">
          <Link href="/life/marketing/calendar" aria-current={!isMonth ? 'page' : undefined}>Board</Link>
          <Link href="/life/marketing/calendar?view=month" aria-current={isMonth ? 'page' : undefined}>Month</Link>
        </div>
        {isMonth && (
          <div className="flex items-center gap-3">
            <Link className="life-btn" href={href(shiftMonth(month, -1))}>Previous</Link>
            <span className="text-sm font-bold text-navy">{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</span>
            <Link className="life-btn" href={href(shiftMonth(month, 1))}>Next</Link>
          </div>
        )}
      </div>
      {isMonth ? <Month posts={posts} month={month} /> : <Board posts={posts} />}
    </div>
  );
}
