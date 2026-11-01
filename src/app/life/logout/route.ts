import { NextResponse } from 'next/server';
import { createLifeClient } from '@/lib/life/supabase-server';

// POST only, so a prefetch or stray GET cannot sign the owner out.
export async function POST(request: Request) {
  const supabase = await createLifeClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/life/login', request.url), { status: 303 });
}
