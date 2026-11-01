import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AIRPORTS, airportInfo } from './airports';
import {
  CONFIDENCE_THRESHOLD,
  detectConflicts,
  normalizeFlightNumber,
  normalizeHotelName,
  resolveLeg,
  utcToLocalDate,
  type ComparableLeg,
  type ExtractedLeg,
  type ResolvedLeg,
  type TravelExtraction,
} from './legs';

// W3 routing: turn a TravelExtraction into places + trip_legs rows, or into
// review_queue proposals when confidence is low or something conflicts.
// Callers run rebuildTrips() afterwards when `legsChanged` is true.

export interface ApplyResult {
  written: number;
  queued: number;
  cancelled: number;
  legsChanged: boolean;
  notes: string[];
}

interface StoredLeg {
  id: string;
  leg_key: string;
  kind: ResolvedLeg['kind'];
  status: ResolvedLeg['status'];
  confirmation_code: string | null;
  number: string | null;
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  origin_place_id: string | null;
  destination_place_id: string | null;
}

const LEG_COLUMNS =
  'id,leg_key,kind,status,confirmation_code,number,starts_at,start_tz,ends_at,end_tz,origin_place_id,destination_place_id';
const WINDOW_MS = 60 * 86400000;

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function sameNumber(kind: ResolvedLeg['kind'], a: string | null, b: string | null): boolean {
  if (kind === 'hotel') return normalizeHotelName(a) === normalizeHotelName(b);
  if (kind === 'flight') return normalizeFlightNumber(a) === normalizeFlightNumber(b);
  return (a ?? '').trim().toUpperCase() === (b ?? '').trim().toUpperCase();
}

class Applier {
  private airportIds = new Map<string, { id: string; city: string | null }>();
  private placesAreaId: string | null | undefined;
  private placeIata = new Map<string, string>(); // place id -> iata
  result: ApplyResult = { written: 0, queued: 0, cancelled: 0, legsChanged: false, notes: [] };

  constructor(
    private db: SupabaseClient,
    private ownerId: string,
    private sourceItemId: string | null,
    private sourceSlug: string,
    private home: string
  ) {}

  async loadAirports() {
    const { data, error } = await this.db
      .from('places')
      .select('id,iata,city')
      .eq('owner_id', this.ownerId)
      .eq('kind', 'airport')
      .not('iata', 'is', null);
    check(error);
    for (const p of (data ?? []) as { id: string; iata: string; city: string | null }[]) {
      this.airportIds.set(p.iata, { id: p.id, city: p.city });
      this.placeIata.set(p.id, p.iata);
    }
  }

  isKnownAirport = (iata: string) => !!AIRPORTS[iata] || !!this.airportIds.get(iata)?.city;

  tzForIata = (iata: string) => airportInfo(iata)?.tz ?? null;

  // places.iata has a partial unique index, which PostgREST upsert cannot target,
  // so this is select-then-insert (the cache above makes it one query per new code).
  async ensureAirport(iata: string): Promise<string> {
    const hit = this.airportIds.get(iata);
    if (hit) return hit.id;
    const info = airportInfo(iata);
    const { data, error } = await this.db
      .from('places')
      .insert({
        owner_id: this.ownerId,
        kind: 'airport',
        iata,
        name: info ? `${info.city} (${iata})` : iata,
        city: info?.city ?? null,
        country: info?.country ?? null,
        lat: info?.lat ?? null,
        lng: info?.lng ?? null,
      })
      .select('id')
      .single();
    if (error) {
      // Lost a race with a concurrent insert: read it back.
      const again = await this.db.from('places').select('id').eq('owner_id', this.ownerId).eq('iata', iata).maybeSingle();
      if (!again.data) throw new Error(error.message);
      this.airportIds.set(iata, { id: again.data.id, city: info?.city ?? null });
      return again.data.id;
    }
    this.airportIds.set(iata, { id: data.id, city: info?.city ?? null });
    this.placeIata.set(data.id, iata);
    return data.id;
  }

  async ensureHotel(leg: ResolvedLeg): Promise<string | null> {
    if (!leg.hotel_name) return null;
    const { data, error } = await this.db
      .from('places')
      .select('id')
      .eq('owner_id', this.ownerId)
      .eq('kind', 'hotel')
      .ilike('name', leg.hotel_name.replace(/[%_]/g, '\\$&'))
      .limit(1);
    check(error);
    if (data?.length) return data[0].id;
    const ins = await this.db
      .from('places')
      .insert({ owner_id: this.ownerId, kind: 'hotel', name: leg.hotel_name, city: leg.city, country: leg.country })
      .select('id')
      .single();
    check(ins.error);
    return ins.data!.id;
  }

  async areaId(): Promise<string | null> {
    if (this.placesAreaId === undefined) {
      const { data } = await this.db.from('areas').select('id').eq('slug', 'places').maybeSingle();
      this.placesAreaId = data?.id ?? null;
    }
    return this.placesAreaId ?? null;
  }

  async queue(proposed: Record<string, unknown>, confidence: number, reason: string) {
    const { error } = await this.db.from('review_queue').insert({
      owner_id: this.ownerId,
      source_item_id: this.sourceItemId,
      area_id: await this.areaId(),
      kind: 'trip_leg',
      proposed: { ...proposed, after: 'rebuild_trips' },
      confidence,
      reason,
    });
    check(error);
    this.result.queued++;
  }

  async legsNear(startsAt: string): Promise<StoredLeg[]> {
    const t = Date.parse(startsAt);
    const { data, error } = await this.db
      .from('trip_legs')
      .select(LEG_COLUMNS)
      .eq('owner_id', this.ownerId)
      .gte('starts_at', new Date(t - WINDOW_MS).toISOString())
      .lte('starts_at', new Date(t + WINDOW_MS).toISOString());
    check(error);
    return (data ?? []) as StoredLeg[];
  }

  comparable(s: StoredLeg): ComparableLeg {
    return {
      leg_key: s.leg_key,
      kind: s.kind,
      status: s.status,
      starts_at: s.starts_at,
      start_tz: s.start_tz,
      ends_at: s.ends_at,
      end_tz: s.end_tz,
      origin_iata: s.origin_place_id ? this.placeIata.get(s.origin_place_id) ?? null : null,
      destination_iata: s.destination_place_id ? this.placeIata.get(s.destination_place_id) ?? null : null,
      hotel_name: s.kind === 'hotel' ? s.number : null,
    };
  }

  async rowValues(leg: ResolvedLeg, extracted: ExtractedLeg) {
    let origin: string | null = null;
    let dest: string | null = null;
    if (leg.kind === 'flight') {
      if (leg.origin_iata) origin = await this.ensureAirport(leg.origin_iata);
      if (leg.destination_iata) dest = await this.ensureAirport(leg.destination_iata);
    } else if (leg.kind === 'hotel') {
      dest = await this.ensureHotel(leg);
    }
    const city = leg.kind === 'flight' ? airportInfo(leg.destination_iata)?.city ?? extracted.destination_city : leg.city;
    return {
      owner_id: this.ownerId,
      kind: leg.kind,
      status: leg.status,
      confirmation_code: leg.confirmation_code,
      provider: leg.provider,
      number: leg.number,
      origin_place_id: origin,
      destination_place_id: dest,
      starts_at: leg.starts_at,
      start_tz: leg.start_tz,
      ends_at: leg.ends_at,
      end_tz: leg.end_tz,
      address: leg.address,
      leg_key: leg.leg_key,
      source_item_id: this.sourceItemId,
      raw: { ...extracted, city, country: leg.country, source: this.sourceSlug },
    };
  }

  // ---- cancellation ----
  async cancel(x: ExtractedLeg) {
    const code = x.confirmation_code?.trim().toUpperCase();
    if (!code) {
      this.result.notes.push('cancellation without a confirmation code');
      return;
    }
    const { data, error } = await this.db
      .from('trip_legs')
      .select(LEG_COLUMNS)
      .eq('owner_id', this.ownerId)
      .eq('confirmation_code', code)
      .neq('status', 'cancelled');
    check(error);
    let matches = (data ?? []) as StoredLeg[];
    if (x.number || x.hotel_name) {
      const num = x.kind === 'hotel' ? x.hotel_name ?? x.number : x.number;
      const narrowed = matches.filter((m) => m.kind === x.kind && sameNumber(m.kind, m.number, num));
      if (narrowed.length) matches = narrowed;
    }
    const date = x.starts_at_local?.slice(0, 10);
    if (matches.length > 1 && date) {
      const byDate = matches.filter((m) => utcToLocalDate(m.starts_at, m.start_tz) === date);
      if (byDate.length) matches = byDate;
    }
    if (!matches.length) {
      this.result.notes.push(`cancellation ${code}: no matching legs on file`);
      return;
    }
    for (const m of matches) {
      if (x.confidence < CONFIDENCE_THRESHOLD) {
        await this.queue(
          { action: 'update', table: 'trip_legs', id: m.id, values: { status: 'cancelled' } },
          x.confidence,
          `low-confidence cancellation of ${m.leg_key}`
        );
      } else {
        check((await this.db.from('trip_legs').update({ status: 'cancelled' }).eq('id', m.id)).error);
        this.result.cancelled++;
        this.result.legsChanged = true;
      }
    }
  }

  // ---- booking or change ----
  async upsert(x: ExtractedLeg, isChange: boolean) {
    const { leg, problems } = resolveLeg(isChange ? { ...x, status: 'changed' } : x, this.tzForIata);
    if (!leg) {
      this.result.notes.push(`skipped leg: ${problems.join('; ')}`);
      await this.queue(
        { action: 'upsert', table: 'trip_legs', values: { raw: x }, onConflict: 'owner_id,leg_key' },
        x.confidence,
        `could not resolve leg: ${problems.join('; ')}`
      );
      return;
    }

    const near = await this.legsNear(leg.starts_at);
    const localDate = leg.starts_at.length ? utcToLocalDate(leg.starts_at, leg.start_tz) : '';

    // Existing row for the same booking under a different key:
    // a change matches on confirmation + number regardless of date;
    // otherwise the same kind + number + local date from another source (TripIt vs Gmail).
    let target: StoredLeg | undefined;
    if (isChange && leg.confirmation_code) {
      const { data, error } = await this.db
        .from('trip_legs')
        .select(LEG_COLUMNS)
        .eq('owner_id', this.ownerId)
        .eq('confirmation_code', leg.confirmation_code)
        .eq('kind', leg.kind);
      check(error);
      target = ((data ?? []) as StoredLeg[]).find((s) => sameNumber(s.kind, s.number, leg.number));
    }
    if (!target) {
      target = near.find(
        (s) =>
          s.leg_key === leg.leg_key ||
          (s.kind === leg.kind && sameNumber(s.kind, s.number, leg.number) && utcToLocalDate(s.starts_at, s.start_tz) === localDate)
      );
    }

    const values = await this.rowValues(leg, x);
    if (target) {
      // Keep the stored key (and confirmation code if the new source lacks one).
      values.leg_key = target.leg_key === leg.leg_key || !isChange ? target.leg_key : leg.leg_key;
      values.confirmation_code = leg.confirmation_code ?? target.confirmation_code;
      if (!isChange && target.status === 'changed') values.status = 'changed';
    }

    const reasons: string[] = [...problems];
    if (leg.confidence < CONFIDENCE_THRESHOLD) reasons.push(`confidence ${leg.confidence.toFixed(2)}`);
    const candidate: ComparableLeg = { ...leg, leg_key: values.leg_key };
    const others = near.filter((s) => s.id !== target?.id).map((s) => this.comparable(s));
    reasons.push(...detectConflicts(candidate, others, { home: this.home, isKnownAirport: this.isKnownAirport }));

    if (reasons.length) {
      const proposed = target
        ? { action: 'update', table: 'trip_legs', id: target.id, values }
        : { action: 'upsert', table: 'trip_legs', values, onConflict: 'owner_id,leg_key' };
      await this.queue(proposed, leg.confidence, reasons.join('; '));
      return;
    }

    if (target) {
      check((await this.db.from('trip_legs').update(values).eq('id', target.id)).error);
    } else {
      check((await this.db.from('trip_legs').upsert(values, { onConflict: 'owner_id,leg_key' })).error);
    }
    this.result.written++;
    this.result.legsChanged = true;
  }
}

export async function applyTravel(
  db: SupabaseClient,
  ownerId: string,
  sourceItemId: string | null,
  extraction: TravelExtraction,
  sourceSlug = 'gmail'
): Promise<ApplyResult> {
  const home = (process.env.HOME_AIRPORT || 'SGN').toUpperCase();
  const a = new Applier(db, ownerId, sourceItemId, sourceSlug, home);
  if (extraction.kind === 'not_travel' || !extraction.legs.length) return a.result;

  // Re-processing an item replaces its earlier pending proposals.
  if (sourceItemId) {
    check((await db.from('review_queue').delete().eq('source_item_id', sourceItemId).eq('status', 'pending')).error);
  }
  await a.loadAirports();

  for (const leg of extraction.legs) {
    if (extraction.kind === 'cancellation' || leg.status === 'cancelled') await a.cancel(leg);
    else await a.upsert(leg, extraction.kind === 'change' || leg.status === 'changed');
  }
  return a.result;
}

export async function markProcessed(
  db: SupabaseClient,
  sourceItemId: string,
  extraction: unknown,
  error: string | null = null
) {
  const { error: e } = await db
    .from('source_items')
    .update(error ? { error, extraction } : { processed_at: new Date().toISOString(), extraction, error: null })
    .eq('id', sourceItemId);
  check(e);
}
