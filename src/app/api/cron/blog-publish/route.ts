import { hasSecret } from '@/lib/life/auth';
import { lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import { publishPost } from '@/lib/blog/publish';

// Daily at 08:00 Vietnam time: every scheduled post that is due. A post that
// fails the gate stays scheduled and is reported; the others still go out.
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!hasSecret(request, 'CRON_SECRET')) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const finish = await startRun('blog-publish');
  try {
    const { data, error } = await lifeAdmin
      .from('posts')
      .select('id, slug')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for');
    if (error) throw new Error(error.message);

    const results = [];
    for (const row of data ?? []) results.push({ slug: row.slug, ...(await publishPost(lifeAdmin, row.id, 'cron')) });
    const failed = results.filter((r) => !r.ok);
    await finish({ itemsIn: results.length, itemsOut: results.length - failed.length, error: failed.length ? JSON.stringify(failed).slice(0, 500) : undefined });
    return Response.json({ ok: failed.length === 0, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finish({ error: message });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
