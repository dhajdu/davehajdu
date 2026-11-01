import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Session-scoped client for /life pages, server actions and route handlers.
// Uses the publishable key + the signed-in user's cookies, so RLS applies.
export async function createLifeClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          // Server Components cannot set cookies; proxy.ts refreshes them instead.
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}
