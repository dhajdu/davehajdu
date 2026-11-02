import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, PageHeader } from '@/components/life/ui';
import { Bloodwork } from '@/components/life/health/Bloodwork';
import { getLongGoals } from '@/lib/life/focus';
import { getLabs } from '@/lib/life/labs';
import { formatDate, ictToday } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Medical', robots: { index: false, follow: false } };

type RecordRow = { id: string; kind: string; title: string; started_on: string | null; ended_on: string | null; date_precision: string; notes: string | null };
type LinkRow = { from_id: string; to_id: string };

function when(r: RecordRow): string {
  if (!r.started_on) return r.notes?.match(/^(Age \d+|Between .+?)(\.|$)/)?.[1] ?? 'Date unknown';
  if (r.date_precision === 'year') return r.started_on.slice(0, 4);
  if (r.date_precision === 'approx') return `About ${r.started_on.slice(0, 4)}`;
  if (r.date_precision === 'month') return formatDate(r.started_on, { month: 'short', year: 'numeric' });
  return formatDate(r.started_on);
}

// Bloodwork and the medical record: surgeries, injuries, lab panels, with their documents.
export default async function MedicalPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const [labs, goals, recordsRes] = await Promise.all([
    getLabs(supabase),
    getLongGoals(supabase),
    supabase
      .from('records')
      .select('id, kind, title, started_on, ended_on, date_precision, notes')
      .in('kind', ['surgery', 'injury', 'lab', 'diagnosis', 'hospital'])
      .order('started_on', { ascending: false, nullsFirst: false }),
  ]);
  const labGoals = goals
    .filter((g) => g.status === 'open' && g.metric && g.target_value !== null)
    .map((g) => ({ metricSlug: g.metric!.slug, target: Number(g.target_value) }));
  const records = (recordsRes.data ?? []) as RecordRow[];
  const { data: links } = records.length
    ? await supabase.from('links').select('from_id, to_id').eq('from_type', 'records').eq('to_type', 'documents').eq('relation', 'attached').in('from_id', records.map((r) => r.id))
    : { data: [] };
  const docByRecord = new Map(((links ?? []) as LinkRow[]).map((l) => [l.from_id, l.to_id]));

  return (
    <div className="max-w-5xl">
      <PageHeader title="Medical" subtitle="Bloodwork across every panel, and the record of what happened to the body" />
      <div className="space-y-5">
        <Card title="Bloodwork">
          <Bloodwork labs={labs} goals={labGoals} today={today} />
        </Card>

        <Card title="Medical record">
          {records.length === 0 ? (
            <p className="text-sm text-muted">No records yet.</p>
          ) : (
            <ol className="border-l-2 border-border ml-1">
              {records.map((r) => (
                <li key={r.id} className="relative pl-4 pb-4 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-navy" />
                  <p className="text-xs text-muted">{when(r)}</p>
                  <p className="text-sm font-semibold text-navy">
                    {r.title} <Chip tone={r.kind === 'lab' ? 'blue' : r.kind === 'surgery' ? 'magenta' : 'gray'}>{r.kind}</Chip>
                  </p>
                  {r.notes && !r.notes.startsWith('Out of range:') && !r.notes.startsWith('Everything in range') && <p className="text-xs text-body-text mt-0.5">{r.notes}</p>}
                  {docByRecord.get(r.id) && (
                    <Link href={`/api/life/documents/${docByRecord.get(r.id)}`} target="_blank" className="text-xs font-semibold text-blue">
                      Document
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
