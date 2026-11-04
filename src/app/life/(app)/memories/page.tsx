import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { lifeAdmin } from '@/lib/life/supabase-admin';
import { connection, googleConfigured } from '@/lib/life/google-photos';
import { ictToday } from '@/lib/life/metrics';
import { PageHeader, Card, ButtonLink, EmptyState } from '@/components/life/ui';
import ImportButton from './ImportButton';

export const metadata: Metadata = { title: 'Memories', robots: { index: false, follow: false } };

type Memory = { id: string; thumb_path: string; taken_at: string; caption: string | null };

const ICT = 'Asia/Ho_Chi_Minh';
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: ICT });
const dayLabel = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: ICT });
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: ICT }); // YYYY-MM-DD

async function load(ownerId: string) {
  const { supabase } = await requireOwner();
  const [{ data }, google] = await Promise.all([
    supabase.from('memories').select('id, thumb_path, taken_at, caption').order('taken_at', { ascending: false }).limit(600),
    connection(ownerId),
  ]);
  const memories = (data ?? []) as Memory[];
  const signed = memories.length
    ? await lifeAdmin.storage.from('memories').createSignedUrls(memories.map((m) => m.thumb_path), 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const url = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  return { memories, url, google };
}

function Photo({ m, src }: { m: Memory; src?: string | null }) {
  const when = dayLabel.format(new Date(m.taken_at));
  return (
    <a href={`/api/life/memories/${m.id}`} target="_blank" rel="noopener noreferrer" className="life-photo" title={m.caption ?? when}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt={m.caption ?? when} loading="lazy" />}
    </a>
  );
}

export default async function MemoriesPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const { user } = await requireOwner();
  const [{ memories, url, google }, params] = await Promise.all([load(user.id), searchParams]);

  const today = ictToday().slice(5); // MM-DD
  const onThisDay = memories.filter((m) => ymd.format(new Date(m.taken_at)).slice(5) === today);

  const byMonth = new Map<string, Memory[]>();
  for (const m of memories) {
    const k = monthLabel.format(new Date(m.taken_at));
    byMonth.set(k, [...(byMonth.get(k) ?? []), m]);
  }

  const configured = googleConfigured();
  const action = !configured ? null : google ? <ImportButton /> : <ButtonLink href="/life/auth/google" primary>Connect Google Photos</ButtonLink>;

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Memories" subtitle="Photos worth keeping" actions={action} />

      {params.connected && google && <p className="text-sm text-muted">Connected to Google Photos as {google.account_email ?? 'your account'}.</p>}
      {params.error === 'google' && <p className="text-sm text-magenta">Google did not finish connecting. Try again.</p>}
      {!configured && <p className="text-sm text-muted">Google Photos is not set up yet: the app needs GOOGLE_PHOTOS_CLIENT_ID and GOOGLE_PHOTOS_CLIENT_SECRET.</p>}

      {onThisDay.length > 0 && (
        <Card title="On this day">
          <div className="life-photo-strip">
            {onThisDay.map((m) => (
              <Photo key={m.id} m={m} src={url.get(m.thumb_path)} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        {memories.length === 0 ? (
          <EmptyState>{google ? 'Nothing imported yet. Pick a batch from Google Photos to start.' : 'Connect Google Photos, then import the photos worth keeping.'}</EmptyState>
        ) : (
          [...byMonth].map(([month, items]) => (
            <section key={month}>
              <h3 className="life-month-label">{month}</h3>
              <div className="life-photo-grid">
                {items.map((m) => (
                  <Photo key={m.id} m={m} src={url.get(m.thumb_path)} />
                ))}
              </div>
            </section>
          ))
        )}
      </Card>
    </div>
  );
}
