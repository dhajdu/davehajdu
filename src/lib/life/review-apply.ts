import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

// review_queue.proposed contract, shared by every extractor and importer.
export type Proposal = (
  | { action: 'upsert'; table: string; values: Record<string, unknown>; onConflict?: string }
  | { action: 'update'; table: string; id: string; values: Record<string, unknown> }
) & { after?: 'rebuild_trips' };

// Owner-scoped tables a proposal may write. Frame tables (areas, metrics,
// sources) and plumbing stay out: RLS blocks them anyway, this fails earlier.
const WRITABLE = new Set([
  'tags', 'taggables', 'places', 'records', 'measurements', 'entries', 'reviews', 'review_scores',
  'goals', 'trips', 'trip_legs', 'people', 'interactions', 'accounts', 'balances', 'documents',
  'obligations', 'media', 'links',
]);

export function parseProposal(raw: unknown): Proposal {
  const p = raw as Partial<Proposal> | null;
  if (!p || typeof p !== 'object' || typeof p.table !== 'string' || !p.values || typeof p.values !== 'object') {
    throw new Error('Proposal is malformed');
  }
  if (!WRITABLE.has(p.table)) throw new Error(`Proposals cannot write to ${p.table}`);
  if (p.action === 'update' && typeof (p as { id?: unknown }).id !== 'string') throw new Error('Update proposal needs an id');
  if (p.action !== 'upsert' && p.action !== 'update') throw new Error('Unknown proposal action');
  return p as Proposal;
}

// Applies a proposal with the caller's session client, so RLS still applies.
export async function applyProposal(db: SupabaseClient, raw: unknown): Promise<Proposal> {
  const p = parseProposal(raw);
  // owner_id always comes from the session default, never from the proposal.
  const { owner_id: _owner, ...values } = p.values;
  void _owner;

  const { error } =
    p.action === 'upsert'
      ? await db.from(p.table).upsert(values, p.onConflict ? { onConflict: p.onConflict } : undefined)
      : await db.from(p.table).update(values).eq('id', p.id);
  if (error) throw new Error(error.message);
  return p;
}
