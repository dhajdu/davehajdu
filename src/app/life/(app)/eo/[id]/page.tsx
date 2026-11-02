import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { Markdown } from '@/components/life/Markdown';
import { formatDate, getAreas } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'EO update', robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EO_ORDER = ['body', 'mind', 'money', 'people', 'work'];
const EO_LABEL: Record<string, string> = { body: 'Physical', mind: 'Mental', money: 'Financial', people: 'Friends & family', work: 'Professional' };

type Entry = { id: string; entry_date: string; title: string | null; body_md: string };

export default async function EoUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireOwner();

  const { data: entry } = await supabase.from('entries').select('id, entry_date, title, body_md').eq('kind', 'eo_update').eq('id', id).maybeSingle();
  if (!entry) notFound();
  const e = entry as Entry;

  const [areas, reviewRes, presRes] = await Promise.all([
    getAreas(supabase),
    supabase.from('reviews').select('id, period, one_word, headline').eq('entry_id', e.id).maybeSingle(),
    supabase.from('entries').select('id, title, body_md').eq('kind', 'presentation').eq('entry_date', e.entry_date).order('title'),
  ]);
  const review = reviewRes.data as { id: string; period: string; one_word: string | null; headline: string | null } | null;
  const { data: scores } = review ? await supabase.from('review_scores').select('area_id, score').eq('review_id', review.id) : { data: [] };
  const slugOf = new Map(areas.map((a) => [a.id, a.slug]));
  const score = new Map<string, number>();
  for (const s of (scores ?? []) as { area_id: string; score: number | string | null }[]) {
    const slug = slugOf.get(s.area_id);
    if (slug && s.score !== null) score.set(slug, Number(s.score));
  }
  const presentations = ((presRes.data ?? []) as Entry[]).filter((p) => p.body_md.trim().length > 0);

  return (
    <div className="max-w-3xl">
      <Link href="/life/eo" className="inline-block text-xs font-semibold text-blue mb-3">← EO updates</Link>
      <PageHeader
        eyebrow={formatDate(e.entry_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        title={e.title ?? 'EO update'}
        subtitle={review?.one_word ? `One word: ${review.one_word}` : undefined}
        actions={review ? <Link href={`/life/review/${review.period}`} className="life-btn">Month in the app</Link> : undefined}
      />

      <div className="space-y-5">
        {score.size > 0 && (
          <section className="life-eo-grid" aria-label="Scores">
            {EO_ORDER.map((slug) => {
              const v = score.get(slug);
              return (
                <div key={slug} className={`life-stat${v !== undefined && v <= 4 ? ' is-low' : ''}`}>
                  <p className="life-stat-k">{EO_LABEL[slug]}</p>
                  <p className="life-stat-v">{v ?? '–'}<small>/ 10</small></p>
                </div>
              );
            })}
          </section>
        )}

        <Card>
          <Markdown lines={e.body_md.split('\n')} />
        </Card>

        {presentations.length > 0 && (
          <Card title={`Presentations · ${presentations.length}`}>
            <div className="life-history">
              {presentations.map((p) => (
                <details key={p.id}>
                  <summary><span>{p.title}</span></summary>
                  <Markdown lines={p.body_md.split('\n')} />
                </details>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
