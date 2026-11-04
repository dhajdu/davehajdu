import { NextResponse, type NextRequest } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { connect, siteOrigin } from '@/lib/life/google-photos';
import { STATE_COOKIE } from '../route';

// Google sends the owner back here with a code; we store the tokens and land
// on Memories. Any failure lands on Memories with an error flag instead.
export async function GET(request: NextRequest) {
  const memories = new URL('/life/memories', request.url);
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.redirect(new URL('/life/login', request.url));

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) {
    memories.searchParams.set('error', 'google');
    return NextResponse.redirect(memories);
  }

  try {
    await connect(ctx.user.id, code, `${siteOrigin(request)}/life/auth/google/callback`);
    memories.searchParams.set('connected', '1');
  } catch {
    memories.searchParams.set('error', 'google');
  }
  const res = NextResponse.redirect(memories);
  res.cookies.delete(STATE_COOKIE);
  return res;
}
