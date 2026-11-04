import { NextResponse, type NextRequest } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { authUrl, googleConfigured, siteOrigin } from '@/lib/life/google-photos';

export const STATE_COOKIE = 'life_google_state';

// Starts the Google Photos connection: only the signed-in owner can begin it.
export async function GET(request: NextRequest) {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.redirect(new URL('/life/login', request.url));
  if (!googleConfigured()) return NextResponse.redirect(new URL('/life/memories?error=config', request.url));

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authUrl(`${siteOrigin(request)}/life/auth/google/callback`, state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', secure: true, path: '/life/auth/google', maxAge: 600 });
  return res;
}
