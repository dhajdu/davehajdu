import { NextResponse, type NextRequest } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { siteOrigin } from '@/lib/life/google-photos';
import { startRun } from '@/lib/life/supabase-admin';
import { connectWhoop, syncWhoop } from '@/lib/life/whoop';
import { STATE_COOKIE } from '../route';

export const maxDuration = 60;

// Whoop sends the owner back here with a code; we store the tokens, pull the
// last 30 days and land on Sources. A failure lands there with an error flag.
export async function GET(request: NextRequest) {
  const sources = new URL('/life/sources', request.url);
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.redirect(new URL('/life/login', request.url));

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) {
    sources.searchParams.set('whoop', 'error');
    return NextResponse.redirect(sources);
  }

  try {
    await connectWhoop(ctx.user.id, code, `${siteOrigin(request)}/life/auth/whoop/callback`);
    sources.searchParams.set('whoop', 'connected');
    const finish = await startRun('whoop_sync', 'whoop');
    try {
      const r = await syncWhoop(ctx.user.id, 30);
      await finish({ itemsIn: r.days, itemsOut: r.measurements });
    } catch (e) {
      await finish({ error: e instanceof Error ? e.message : String(e) });
    }
  } catch {
    sources.searchParams.set('whoop', 'error');
  }
  const res = NextResponse.redirect(sources);
  res.cookies.delete(STATE_COOKIE);
  return res;
}
