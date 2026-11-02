import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import { NotionClient, runNotionSync } from '@/lib/life/notion';
import { syncTodosFromJournal } from '@/lib/life/todos-sync';
import { fetchLatestJournal } from '@/lib/life/notion/latest';

// Nightly W2: pages edited in the last 48 hours, same transforms as the full import.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!hasSecret(request, 'CRON_SECRET')) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const finish = await startRun('notion', 'notion');
  try {
    const notion = new NotionClient({ token: process.env.NOTION_TOKEN ?? '' });
    const since = new Date(Date.now() - 48 * 3_600_000).toISOString();
    const owner = await getOwnerId();
    const report = await runNotionSync({ notion, db: lifeAdmin, ownerId: owner }, { since });
    // The journal's DOING and DONE lists become to-dos; only the last two weeks need re-reading.
    const todos = await syncTodosFromJournal(lifeAdmin, owner, new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10), await fetchLatestJournal(notion));
    const itemsOut = Object.values(report.entries).reduce((a, b) => a + b, 0) + report.reviews + report.measurements + todos.inserted + todos.completed;
    await finish({ itemsIn: report.journalPages + report.eoPages, itemsOut });
    const { samples: _samples, ...summary } = report;
    void _samples;
    return Response.json({ ok: true, since, ...summary, todos });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await finish({ error });
    return Response.json({ ok: false, error }, { status: 500 });
  }
}
