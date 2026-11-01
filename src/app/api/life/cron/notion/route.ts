import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import { NotionClient, runNotionSync } from '@/lib/life/notion';

// Nightly W2: pages edited in the last 48 hours, same transforms as the full import.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!hasSecret(request, 'CRON_SECRET')) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const finish = await startRun('notion', 'notion');
  try {
    const notion = new NotionClient({ token: process.env.NOTION_TOKEN ?? '' });
    const since = new Date(Date.now() - 48 * 3_600_000).toISOString();
    const report = await runNotionSync({ notion, db: lifeAdmin, ownerId: await getOwnerId() }, { since });
    const itemsOut = Object.values(report.entries).reduce((a, b) => a + b, 0) + report.reviews + report.measurements;
    await finish({ itemsIn: report.journalPages + report.eoPages, itemsOut });
    const { samples: _samples, ...summary } = report;
    void _samples;
    return Response.json({ ok: true, since, ...summary });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await finish({ error });
    return Response.json({ ok: false, error }, { status: 500 });
  }
}
