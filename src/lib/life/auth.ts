import 'server-only';
import { redirect } from 'next/navigation';
import { createLifeClient } from './supabase-server';

function isOwnerEmail(email: string | undefined) {
  return !!email && email.toLowerCase() === process.env.LIFE_OWNER_EMAIL?.toLowerCase();
}

// Returns the session client if the caller is the signed-in owner, otherwise
// null. Use in route handlers: `if (!ctx) return 401`.
export async function getOwnerContext() {
  const supabase = await createLifeClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) return null;
  return { supabase, user };
}

// For pages, layouts and server actions. Redirects anyone who is not the
// fully-authenticated owner. This is the authoritative check; proxy.ts is UX only.
export async function requireOwner() {
  const ctx = await getOwnerContext();
  if (!ctx) redirect('/life/login');
  return ctx;
}

// Bearer-secret check for machine callers (Apps Script, Health Auto Export, cron).
export function hasSecret(request: Request, envName: 'LIFE_INGEST_SECRET' | 'CRON_SECRET') {
  const expected = process.env[envName];
  const header = request.headers.get('authorization') ?? '';
  return !!expected && header === `Bearer ${expected}`;
}
