import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import { airportInfo } from '@/lib/life/extract/airports';
import { dedupeEvents, icalToLegs, parseIcal } from '@/lib/life/extract/ical';
import { applyTravel, markProcessed } from '@/lib/life/extract/apply-travel';
import { rebuildTrips } from '@/lib/life/trips';

// Daily TripIt iCal sync. Flights and hotel stays go through the same apply
// path as Gmail extractions, with source 'tripit' and external_id = event UID.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!hasSecret(request, 'CRON_SECRET')) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.TRIPIT_ICAL_URL;
  if (!url) return Response.json({ error: 'TRIPIT_ICAL_URL is not set' }, { status: 500 });

  const finish = await startRun('tripit_sync', 'tripit');
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`TripIt feed returned ${res.status}`);
    const events = dedupeEvents(parseIcal(await res.text()));
    const { legs, skipped } = icalToLegs(events, (iata) => airportInfo(iata));

    const ownerId = await getOwnerId();
    const { data: source, error: srcErr } = await lifeAdmin.from('sources').select('id').eq('slug', 'tripit').single();
    if (srcErr) throw new Error(srcErr.message);

    const { data: seen, error: seenErr } = await lifeAdmin
      .from('source_items')
      .select('external_id,payload,processed_at')
      .eq('source_id', source.id)
      .limit(5000);
    if (seenErr) throw new Error(seenErr.message);
    const prior = new Map((seen ?? []).map((s: { external_id: string; payload: unknown; processed_at: string | null }) => [s.external_id, s]));

    let applied = 0;
    let unchanged = 0;
    let queued = 0;
    let legsChanged = false;
    const errors: string[] = [];

    for (const { external_id, leg } of legs) {
      const payload = { leg };
      const before = prior.get(external_id);
      if (before?.processed_at && JSON.stringify(before.payload) === JSON.stringify(payload)) {
        unchanged++;
        continue;
      }
      const { data: item, error } = await lifeAdmin
        .from('source_items')
        .upsert(
          { owner_id: ownerId, source_id: source.id, external_id, received_at: new Date().toISOString(), payload, processed_at: null },
          { onConflict: 'source_id,external_id' }
        )
        .select('id')
        .single();
      if (error) {
        errors.push(`${external_id}: ${error.message}`);
        continue;
      }
      try {
        const extraction = { kind: leg.kind, confidence: leg.confidence, notes: null, legs: [leg] };
        const result = await applyTravel(lifeAdmin, ownerId, item.id, extraction, 'tripit');
        await markProcessed(lifeAdmin, item.id, { ...extraction, result });
        applied++;
        queued += result.queued;
        if (result.legsChanged) legsChanged = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${external_id}: ${msg}`);
        await markProcessed(lifeAdmin, item.id, null, msg).catch(() => {});
      }
    }

    if (legsChanged) await rebuildTrips(lifeAdmin, ownerId);

    const summary = { events: events.length, legs: legs.length, skipped: skipped.length, applied, unchanged, queued, errors };
    await finish({ itemsIn: events.length, itemsOut: applied, error: errors.length ? `${errors.length} leg(s) failed` : undefined });
    return Response.json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finish({ error: msg });
    return Response.json({ error: msg }, { status: 500 });
  }
}
