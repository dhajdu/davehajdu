import 'server-only';
import { lifeAdmin } from './supabase-admin';

// Google Photos via the Picker API. Since March 2025 an app cannot read a
// user's library; the owner picks items in Google's UI and we download those.
// Tokens live in `integrations` (service role only).

const PROVIDER = 'google_photos';
const SCOPES = ['https://www.googleapis.com/auth/photospicker.mediaitems.readonly', 'openid', 'email'].join(' ');
const PICKER = 'https://photospicker.googleapis.com/v1';

export class GoogleDisconnected extends Error {}

export function googleConfigured() {
  return !!(process.env.GOOGLE_PHOTOS_CLIENT_ID && process.env.GOOGLE_PHOTOS_CLIENT_SECRET);
}

// The public origin, trusting the proxy headers Vercel sets.
export function siteOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

export function authUrl(redirectUri: string, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_PHOTOS_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; scope?: string; error?: string };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_PHOTOS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET!,
      ...body,
    }),
    cache: 'no-store',
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok) throw new Error(json.error ?? `Google token endpoint returned ${res.status}`);
  return json;
}

function expiresAt(expiresIn: number) {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

// Finishes the OAuth dance: swaps the code for tokens and stores them.
export async function connect(ownerId: string, code: string, redirectUri: string) {
  const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  if (!t.refresh_token) throw new Error('Google did not return a refresh token');
  const who = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${t.access_token}` },
    cache: 'no-store',
  }).then((r): Promise<{ email?: string }> => (r.ok ? r.json() : Promise.resolve({})));
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

export async function connection(ownerId: string) {
  const { data } = await lifeAdmin
    .from('integrations')
    .select('account_email, refresh_token, access_token, expires_at')
    .eq('owner_id', ownerId)
    .eq('provider', PROVIDER)
    .maybeSingle();
  return data;
}

// A live access token, refreshed when within a minute of expiry.
export async function accessToken(ownerId: string) {
  const c = await connection(ownerId);
  if (!c) throw new GoogleDisconnected('Google Photos is not connected');
  if (c.access_token && c.expires_at && new Date(c.expires_at).getTime() - Date.now() > 60_000) return c.access_token;
  let t: TokenResponse;
  try {
    t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: c.refresh_token });
  } catch (e) {
    if (e instanceof Error && e.message === 'invalid_grant') throw new GoogleDisconnected('Google Photos needs reconnecting');
    throw e;
  }
  await lifeAdmin
    .from('integrations')
    .update({ access_token: t.access_token, expires_at: expiresAt(t.expires_in) })
    .eq('owner_id', ownerId)
    .eq('provider', PROVIDER);
  return t.access_token;
}

async function picker<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PICKER}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Picker API returned ${res.status}`);
  return json as T;
}

// expireTime is when Google drops the session; timeoutIn ("1800s") is how long it suggests polling.
export type PickerSession = { id: string; pickerUri: string; mediaItemsSet?: boolean; expireTime?: string; pollingConfig?: { pollInterval?: string; timeoutIn?: string } };

export type PickedItem = {
  id: string;
  createTime: string;
  type: 'PHOTO' | 'VIDEO' | 'TYPE_UNSPECIFIED';
  mediaFile: {
    baseUrl: string;
    mimeType: string;
    filename?: string;
    mediaFileMetadata?: { width?: number; height?: number; cameraMake?: string; cameraModel?: string };
  };
};

export const createPickerSession = (token: string) => picker<PickerSession>(token, '/sessions', { method: 'POST', body: '{}' });
export const getPickerSession = (token: string, id: string) => picker<PickerSession>(token, `/sessions/${encodeURIComponent(id)}`);
export const deletePickerSession = (token: string, id: string) =>
  picker<void>(token, `/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);

export async function listPickedItems(token: string, sessionId: string) {
  const items: PickedItem[] = [];
  let pageToken: string | undefined;
  do {
    const p = new URLSearchParams({ sessionId, pageSize: '100' });
    if (pageToken) p.set('pageToken', pageToken);
    const page = await picker<{ mediaItems?: PickedItem[]; nextPageToken?: string }>(token, `/mediaItems?${p}`);
    items.push(...(page.mediaItems ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
}

// Downloads a rendition. The size suffix keeps aspect ratio within the box.
export async function fetchRendition(token: string, baseUrl: string, box: number) {
  const res = await fetch(`${baseUrl}=w${box}-h${box}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Download failed with ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') ?? 'image/jpeg' };
}
