import { NextResponse, type NextRequest } from 'next/server';
import { createLifeClient } from '@/lib/life/supabase-server';

// Landing point for the emailed sign-in link. Exchanges the one-time code for a
// session cookie, then sends the owner into /life.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const login = new URL('/life/login', request.url);

  if (code) {
    const supabase = await createLifeClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/life/journal', request.url));
  }

  login.searchParams.set('error', 'link');
  return NextResponse.redirect(login);
}
