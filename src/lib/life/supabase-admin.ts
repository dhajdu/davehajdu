import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Secret-key client for ingest routes, cron jobs and scripts ONLY. It bypasses
// RLS, so every row it writes must set owner_id explicitly (use getOwnerId()).
// Never use it in a page or a route that serves owner-facing data.
export const lifeAdmin = createClient(
  process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.LIFE_SUPABASE_SECRET_KEY || 'placeholder-key',
  { auth: { persistSession: false } }
);

let ownerId: string | null = null;

// The single owner's auth user id, looked up by LIFE_OWNER_EMAIL.
// Throws until the owner has signed in once (the user row is created then).
export async function getOwnerId(): Promise<string> {
  if (ownerId) return ownerId;
  const email = process.env.LIFE_OWNER_EMAIL?.toLowerCase();
  const { data, error } = await lifeAdmin.auth.admin.listUsers({ perPage: 50 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) throw new Error('Owner has not signed in to /life yet');
  ownerId = user.id;
  return ownerId;
}

// Records a workflow run and updates the source's last-run status.
export async function startRun(workflow: string, sourceSlug?: string) {
  const owner = await getOwnerId();
  const { data } = await lifeAdmin
    .from('workflow_runs')
    .insert({ workflow, owner_id: owner })
    .select('id')
    .single();
  const runId: string | undefined = data?.id;

  return async function finish(result: { itemsIn?: number; itemsOut?: number; error?: string }) {
    const status = result.error ? 'error' : 'ok';
    if (runId) {
      await lifeAdmin
        .from('workflow_runs')
        .update({
          status,
          finished_at: new Date().toISOString(),
          items_in: result.itemsIn ?? 0,
          items_out: result.itemsOut ?? 0,
          error: result.error ?? null,
        })
        .eq('id', runId);
    }
    if (sourceSlug) {
      await lifeAdmin
        .from('sources')
        .update({ last_run_at: new Date().toISOString(), last_status: result.error ? `error: ${result.error}` : 'ok' })
        .eq('slug', sourceSlug);
    }
  };
}
