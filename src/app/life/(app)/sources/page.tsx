import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { PageHeader, Card, Chip, EmptyState, ButtonLink } from '@/components/life/ui';
import { whoopConfigured, whoopConnection } from '@/lib/life/whoop';

export const metadata: Metadata = { title: 'Sources', robots: { index: false, follow: false } };

const HOUR = 3_600_000;
const CADENCE_MS: Record<string, number> = { hourly: HOUR, daily: 24 * HOUR, nightly: 24 * HOUR, weekly: 168 * HOUR, monthly: 744 * HOUR };

type Source = { id: string; slug: string; name: string; method: string; cadence: string; enabled: boolean; last_run_at: string | null; last_status: string | null };
type Run = { id: string; workflow: string; started_at: string; finished_at: string | null; status: string; items_in: number; items_out: number; error: string | null };

function ago(iso: string | null, now: number) {
  if (!iso) return 'Never';
  const mins = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

function state(s: Source, now: number): 'ok' | 'warn' | 'off' {
  if (!s.enabled || !s.last_run_at) return 'off';
  if (s.last_status?.startsWith('error')) return 'warn';
  const every = CADENCE_MS[s.cadence];
  if (every && now - new Date(s.last_run_at).getTime() > 2 * every) return 'warn';
  return 'ok';
}

const dot = { ok: 'bg-mint', warn: 'bg-magenta', off: 'bg-border' };

async function load() {
  const { supabase, user } = await requireOwner();
  const [{ data: sources }, { data: runs }, whoop] = await Promise.all([
    supabase.from('sources').select('id, slug, name, method, cadence, enabled, last_run_at, last_status').order('name'),
    supabase.from('workflow_runs').select('id, workflow, started_at, finished_at, status, items_in, items_out, error').order('started_at', { ascending: false }).limit(20),
    whoopConnection(user.id),
  ]);
  return { sources: sources as Source[] | null, runs: runs as Run[] | null, whoop, now: Date.now() };
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ whoop?: string }> }) {
  const [{ sources, runs, whoop, now }, params] = await Promise.all([load(), searchParams]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Sources" subtitle="Is everything still flowing?" />

      {params.whoop === 'connected' && whoop && <p className="text-sm text-muted">Connected to Whoop as {whoop.account_email ?? 'your account'}.</p>}
      {params.whoop === 'error' && <p className="text-sm text-magenta">Whoop did not finish connecting. Try again.</p>}
      {params.whoop === 'config' && <p className="text-sm text-magenta">Whoop is not set up: WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET are missing.</p>}

      <Card>
        {!sources?.length ? (
          <EmptyState>No sources registered.</EmptyState>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="font-semibold pb-2 pr-3">Source</th>
                  <th className="font-semibold pb-2 pr-3">Method</th>
                  <th className="font-semibold pb-2 pr-3">Cadence</th>
                  <th className="font-semibold pb-2 pr-3">Last run</th>
                  <th className="font-semibold pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => {
                  const st = state(s, now);
                  return (
                    <tr key={s.id} className="border-t border-border align-top">
                      <td className="py-2 pr-3 font-semibold text-navy">{s.name}</td>
                      <td className="py-2 pr-3">{s.method}</td>
                      <td className="py-2 pr-3">{s.cadence}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dot[st]}`} aria-label={st} />
                        {s.enabled ? ago(s.last_run_at, now) : 'Off'}
                      </td>
                      <td className="py-2 text-muted break-words">
                        {s.slug === 'whoop' ? (
                          whoop ? (
                            <>
                              <Chip tone="mint">Connected</Chip> {s.last_status ?? ''}
                            </>
                          ) : (
                            <span className="flex flex-wrap items-center gap-2">
                              <Chip tone="magenta">Not connected</Chip>
                              {whoopConfigured() && <ButtonLink href="/life/auth/whoop" primary>Connect Whoop</ButtonLink>}
                            </span>
                          )
                        ) : (
                          s.last_status ?? ''
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Last 20 runs">
        {!runs?.length ? (
          <EmptyState>No workflow runs yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {runs.map((r) => (
              <li key={r.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Chip tone={r.status === 'ok' ? 'mint' : r.status === 'error' ? 'magenta' : 'gray'}>{r.status}</Chip>
                <span className="font-semibold text-navy">{r.workflow}</span>
                <span className="text-muted">{ago(r.started_at, now)}</span>
                <span className="text-muted">{r.items_in} in · {r.items_out} out</span>
                {r.error && <span className="w-full text-magenta break-words">{r.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
