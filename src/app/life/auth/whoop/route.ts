import { NextResponse, type NextRequest } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { siteOrigin } from '@/lib/life/google-photos';
import { whoopAuthUrl, whoopConfigured } from '@/lib/life/whoop';

export const STATE_COOKIE = 'life_whoop_state';

// Starts the Whoop connection: only the signed-in owner can begin it.
export async function GET(request: NextRequest) {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.redirect(new URL('/life/login', request.url));
  if (!whoopConfigured()) return NextResponse.redirect(new URL('/life/sources?whoop=config', request.url));

  // Whoop requires the state to be exactly eight characters.
  const state = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const res = NextResponse.redirect(whoopAuthUrl(`${siteOrigin(request)}/life/auth/whoop/callback`, state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', secure: true, path: '/life/auth/whoop', maxAge: 600 });
  return res;
}
