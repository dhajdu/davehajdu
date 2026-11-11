import 'server-only';
import { lifeAdmin } from './supabase-admin';

// Whoop over OAuth, on the same Whoop developer app as the Shadow Forum
// Challenge and Parkes Performance (WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET).
// Tokens live in `integrations` (service role only), like Google Photos.
// Each day lands as one source_item plus one measurement per whoop_* metric,
// the same rows scripts/life/import-whoop.ts writes from a CSV export.

const PROVIDER = 'whoop';
const API = 'https://api.prod.whoop.com';
const SCOPES = 'read:recovery read:cycles read:sleep read:profile offline';
// Whoop sits behind Cloudflare, which turns away Node's default User-Agent (403, error 1010).
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class WhoopDisconnected extends Error {}

export function whoopConfigured() {
  return !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET);
}

export function whoopAuthUrl(redirectUri: string, state: string) {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${API}/oauth/oauth2/auth?${p}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope?: string };

class TokenError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${API}/oauth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT, Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      ...body,
    }),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as (TokenResponse & { error?: string; error_description?: string }) | null;
  if (!res.ok || !json?.access_token) {
    throw new TokenError(json?.error_description ?? json?.error ?? `Whoop token endpoint returned ${res.status}`, res.status);
  }
  return json;
}

async function whoopGet<T>(token: string, path: string, query: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(query)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Whoop API ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

async function whoopList<T>(token: string, path: string, start: string): Promise<T[]> {
  const out: T[] = [];
  let nextToken: string | undefined;
  for (let page = 0; page < 50; page++) {
    const body = await whoopGet<{ records?: T[]; next_token?: string | null }>(token, path, { limit: '25', start, nextToken });
    out.push(...(body.records ?? []));
    if (!body.next_token || body.next_token === nextToken) break;
    nextToken = body.next_token;
  }
  return out;
}

const expiresAt = (expiresIn: number) => new Date(Date.now() + expiresIn * 1000).toISOString();

// Finishes the OAuth dance: swaps the code for tokens and stores them.
export async function connectWhoop(ownerId: string, code: string, redirectUri: string) {
  const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  if (!t.refresh_token) throw new Error('Whoop did not return a refresh token');
  const who = await whoopGet<{ email?: string }>(t.access_token, '/developer/v2/user/profile/basic').catch(() => ({ email: undefined }));
  const { error } = await lifeAdmin.from('integrations').upsert({
    owner_id: ownerId,
    provider: PROVIDER,
    account_email: who.email ?? null,
    refresh_token: t.refresh_token,
    access_token: t.access_token,
    expires_at: expiresAt(t.expires_in),
    scope: t.scope ?? SCOPES,
  });
  if (error) throw new Error(error.message);
}

export async function whoopConnection(ownerId: string) {
  const { data } = await lifeAdmin
    .from('integrations')
    .select('account_email, refresh_token, access_token, expires_at, scope, created_at')
    .eq('owner_id', ownerId)
    .eq('provider', PROVIDER)
    .maybeSingle();
  return data;
}

// A live access token. Whoop rotates the refresh token on every refresh, so
// the new one is always written back. A refused refresh (400 or 401) means the
// grant is dead: the row is removed and Sources shows Connect again.
async function accessToken(ownerId: string) {
  const c = await whoopConnection(ownerId);
  if (!c) throw new WhoopDisconnected('Whoop is not connected');
  if (c.access_token && c.expires_at && new Date(c.expires_at).getTime() - Date.now() > 60_000) return c.access_token as string;
  let t: TokenResponse;
  try {
    t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: c.refresh_token, ...(c.scope ? { scope: c.scope } : {}) });
  } catch (e) {
    if (e instanceof TokenError && (e.status === 400 || e.status === 401)) {
      await lifeAdmin.from('integrations').delete().eq('owner_id', ownerId).eq('provider', PROVIDER);
      throw new WhoopDisconnected('Whoop needs reconnecting');
    }
    throw e;
  }
  const { error } = await lifeAdmin
    .from('integrations')
    .update({ access_token: t.access_token, refresh_token: t.refresh_token ?? c.refresh_token, expires_at: expiresAt(t.expires_in) })
    .eq('owner_id', ownerId)
    .eq('provider', PROVIDER);
  if (error) throw new Error(error.message);
  return t.access_token;
}

type Cycle = { id: number; score?: { strain?: number | null } | null };
type Recovery = {
  cycle_id: number;
  score_state?: string;
  score?: { recovery_score?: number | null; resting_heart_rate?: number | null; hrv_rmssd_milli?: number | null } | null;
};
type Sleep = {
  cycle_id: number;
  nap?: boolean;
  end?: string;
  timezone_offset?: string;
  score_state?: string;
  score?: {
    sleep_performance_percentage?: number | null;
    stage_summary?: {
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
    } | null;
  } | null;
};

// The local date of a Whoop UTC timestamp, given its "+07:00" offset.
function localDay(iso: string, offset: string | undefined): string | null {
  const ms = Date.parse(iso);
  const m = offset?.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!Number.isFinite(ms)) return null;
  const mins = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  return new Date(ms + mins * 60_000).toISOString().slice(0, 10);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// One row of metric values per day. As in the CSV importer, a cycle is dated
// by its wake-up day, so last night's sleep and recovery land on the day they
// describe; a cycle with no main sleep yet is skipped.
export function whoopDays(cycles: Cycle[], recoveries: Recovery[], sleeps: Sleep[]) {
  const recoveryOf = new Map(recoveries.map((r) => [r.cycle_id, r]));
  const days = new Map<string, Record<string, number>>();
  for (const cycle of cycles) {
    const sleep = sleeps
      .filter((s) => s.cycle_id === cycle.id && !s.nap && s.end)
      .sort((a, b) => b.end!.localeCompare(a.end!))[0];
    const day = sleep && localDay(sleep.end!, sleep.timezone_offset);
    if (!sleep || !day) continue;

    const values: Record<string, number> = {};
    const set = (slug: string, v: number | null | undefined) => {
      if (typeof v === 'number' && Number.isFinite(v)) values[slug] = round2(v);
    };
    const recovery = recoveryOf.get(cycle.id);
    if (recovery?.score_state === 'SCORED') {
      set('whoop_recovery', recovery.score?.recovery_score);
      set('whoop_hrv_ms', recovery.score?.hrv_rmssd_milli);
      set('whoop_resting_hr', recovery.score?.resting_heart_rate);
    }
    if (sleep.score_state === 'SCORED') {
      const st = sleep.score?.stage_summary;
      if (st) {
        const asleep = (st.total_light_sleep_time_milli ?? 0) + (st.total_slow_wave_sleep_time_milli ?? 0) + (st.total_rem_sleep_time_milli ?? 0);
        set('whoop_sleep_hours', asleep / 3_600_000);
      }
      set('whoop_sleep_performance', sleep.score?.sleep_performance_percentage);
    }
    set('whoop_strain', cycle.score?.strain);
    if (Object.keys(values).length) days.set(day, values);
  }
  return days;
}

// Pulls the last `lookbackDays` from Whoop and upserts them. Idempotent.
export async function syncWhoop(ownerId: string, lookbackDays: number) {
  const token = await accessToken(ownerId);
  const start = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();
  const [cycles, recoveries, sleeps] = await Promise.all([
    whoopList<Cycle>(token, '/developer/v2/cycle', start),
    whoopList<Recovery>(token, '/developer/v2/recovery', start),
    whoopList<Sleep>(token, '/developer/v2/activity/sleep', start),
  ]);
  const days = whoopDays(cycles, recoveries, sleeps);
  if (!days.size) return { days: 0, measurements: 0 };

  const { data: source, error: sErr } = await lifeAdmin.from('sources').select('id').eq('slug', 'whoop').single();
  if (sErr) throw new Error(`sources: ${sErr.message}`);
  const { data: metrics, error: mErr } = await lifeAdmin.from('metrics').select('id, slug').like('slug', 'whoop_%');
  if (mErr) throw new Error(`metrics: ${mErr.message}`);
  const metricId = new Map((metrics ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id]));

  const now = new Date().toISOString();
  const { data: items, error: iErr } = await lifeAdmin
    .from('source_items')
    .upsert(
      [...days].map(([day, values]) => ({
        owner_id: ownerId,
        source_id: source.id,
        external_id: `whoop:${day}`,
        received_at: now,
        processed_at: now,
        payload: { day, values, via: 'api' },
      })),
      { onConflict: 'source_id,external_id' }
    )
    .select('id, external_id');
  if (iErr) throw new Error(`source_items: ${iErr.message}`);
  const itemId = new Map((items ?? []).map((i: { id: string; external_id: string }) => [i.external_id, i.id]));

  const measurements = [...days].flatMap(([day, values]) =>
    Object.entries(values)
      .filter(([slug]) => metricId.has(slug))
      .map(([slug, value]) => ({
        owner_id: ownerId,
        metric_id: metricId.get(slug)!,
        measured_on: day,
        value,
        source_item_id: itemId.get(`whoop:${day}`) ?? null,
      }))
  );
  const { error } = await lifeAdmin.from('measurements').upsert(measurements, { onConflict: 'owner_id,metric_id,measured_on' });
  if (error) throw new Error(`measurements: ${error.message}`);
  return { days: days.size, measurements: measurements.length };
}
