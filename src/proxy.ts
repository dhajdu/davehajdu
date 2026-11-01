import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Coarse gate for /life: refreshes the Supabase session cookie and bounces
// signed-out visitors to the login page. UX and defense in depth only; the
// authoritative check is requireOwner() / getOwnerContext() on the server.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && pathname.startsWith('/life') && !pathname.startsWith('/life/login')) {
    return NextResponse.redirect(new URL('/life/login', request.url));
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/life/:path*'],
};
