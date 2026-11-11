import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import { extractTravel, type EmailPayload } from '@/lib/life/extract/travel';
import { applyTravel, markProcessed, type ApplyResult } from '@/lib/life/extract/apply-travel';
import { rebuildTrips } from '@/lib/life/trips';

// W1 -> W3: Apps Script POSTs Gmail messages here (single item or a batch of up to 25).
// Each new item is stored in source_items, then extracted inline with Claude.
// Apps Script sends small batches so a call finishes well inside this limit.
export const maxDuration = 300;

const MAX_BATCH = 25;
const CONCURRENCY = 5;

interface IngestItem {
  source: string;
  external_id: string;
  received_at?: string;
  payload: EmailPayload;
}

type ItemResult =
  | { external_id: string; status: 'duplicate' }
  | { external_id: string; status: 'stored' }
  | { external_id: string; status: 'processed'; kind: string; result: ApplyResult }
  | { external_id: string; status: 'error'; error: string };

function validItem(x: unknown): x is IngestItem {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  const p = i.payload as Record<string, unknown> | undefined;
  return (
    typeof i.source === 'string' &&
    typeof i.external_id === 'string' &&
    i.external_id.length > 0 &&
    !!p &&
    typeof p === 'object' &&
    (i.source !== 'gmail' || (typeof p.subject === 'string' && typeof p.body_text === 'string'))
  );
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

export async function POST(request: Request) {
  // The Gmail Apps Script has its own secret, so setting it up never means re-keying Health Auto Export.
  if (!hasSecret(request, 'LIFE_INGEST_SECRET') && !hasSecret(request, 'LIFE_GMAIL_INGEST_SECRET')) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const items = Array.isArray(body) ? body : [body];
  if (!items.length || items.length > MAX_BATCH) {
    return Response.json({ error: `send 1 to ${MAX_BATCH} items` }, { status: 400 });
  }
  if (!items.every(validItem)) {
    return Response.json({ error: 'each item needs source, external_id and payload { from, subject, body_text }' }, { status: 400 });
  }

  const ownerId = await getOwnerId();
  const slugs = [...new Set(items.map((i) => i.source))];
  const { data: sources, error: srcErr } = await lifeAdmin.from('sources').select('id,slug').in('slug', slugs);
  if (srcErr) return Response.json({ error: srcErr.message }, { status: 500 });
  const sourceId = new Map((sources ?? []).map((s: { id: string; slug: string }) => [s.slug, s.id]));
  const unknown = slugs.filter((s) => !sourceId.has(s));
  if (unknown.length) return Response.json({ error: `unknown source ${unknown.join(', ')}` }, { status: 400 });

  const finish = await startRun('gmail_ingest', slugs.length === 1 ? slugs[0] : undefined);
  let legsChanged = false;

  const results = await mapLimit(items, CONCURRENCY, async (item): Promise<ItemResult> => {
    const receivedAt = item.received_at && !Number.isNaN(Date.parse(item.received_at)) ? item.received_at : new Date().toISOString();
    try {
      const { data: inserted, error } = await lifeAdmin
        .from('source_items')
        .upsert(
          {
            owner_id: ownerId,
            source_id: sourceId.get(item.source),
            external_id: item.external_id,
            received_at: receivedAt,
            payload: item.payload,
          },
          { onConflict: 'source_id,external_id', ignoreDuplicates: true }
        )
        .select('id');
      if (error) throw new Error(error.message);

      let itemId = inserted?.[0]?.id as string | undefined;
      if (!itemId) {
        const { data: existing, error: exErr } = await lifeAdmin
          .from('source_items')
          .select('id,processed_at')
          .eq('source_id', sourceId.get(item.source))
          .eq('external_id', item.external_id)
          .single();
        if (exErr) throw new Error(exErr.message);
        if (existing.processed_at) return { external_id: item.external_id, status: 'duplicate' };
        itemId = existing.id as string; // stored before but extraction failed: retry it
      }

      if (item.source !== 'gmail') return { external_id: item.external_id, status: 'stored' };

      try {
        const extraction = await extractTravel(item.payload, receivedAt);
        const result = await applyTravel(lifeAdmin, ownerId, itemId, extraction, 'gmail');
        await markProcessed(lifeAdmin, itemId, { ...extraction, result });
        if (result.legsChanged) legsChanged = true;
        return { external_id: item.external_id, status: 'processed', kind: extraction.kind, result };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await markProcessed(lifeAdmin, itemId, null, msg).catch(() => {});
        return { external_id: item.external_id, status: 'error', error: msg };
      }
    } catch (e) {
      return { external_id: item.external_id, status: 'error', error: e instanceof Error ? e.message : String(e) };
    }
  });

  let rebuildError: string | undefined;
  if (legsChanged) {
    try {
      await rebuildTrips(lifeAdmin, ownerId);
    } catch (e) {
      rebuildError = e instanceof Error ? e.message : String(e);
    }
  }

  const errors = results.filter((r) => r.status === 'error');
  await finish({
    itemsIn: items.length,
    itemsOut: results.filter((r) => r.status === 'processed' || r.status === 'stored').length,
    error: rebuildError ?? (errors.length ? `${errors.length} item(s) failed` : undefined),
  });

  const single = !Array.isArray(body);
  const payload = { results, ...(rebuildError ? { rebuild_error: rebuildError } : {}) };
  // A single duplicate keeps the documented `{ status: 'duplicate' }` shape.
  if (single) return Response.json({ ...results[0], ...(rebuildError ? { rebuild_error: rebuildError } : {}) }, { status: errors.length ? 500 : 200 });
  return Response.json(payload, { status: errors.length === results.length ? 500 : 200 });
}
