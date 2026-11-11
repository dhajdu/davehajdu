import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, startRun } from '@/lib/life/supabase-admin';
import { syncWhoop, whoopConnection } from '@/lib/life/whoop';

// Whoop sync, every six hours: re-reads the last 10 days of recovery, sleep
// and strain, so a late-scored day or a missed run fills in.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!hasSecret(request, 'CRON_SECRET')) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const ownerId = await getOwnerId();
  // Never connected, or already told to reconnect: nothing to run or record.
  if (!(await whoopConnection(ownerId))) return Response.json({ skipped: 'Whoop is not connected' });

  const finish = await startRun('whoop_sync', 'whoop');
  try {
    const r = await syncWhoop(ownerId, 10);
    await finish({ itemsIn: r.days, itemsOut: r.measurements });
    return Response.json(r);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finish({ error: msg });
    return Response.json({ error: msg }, { status: 500 });
  }
}
