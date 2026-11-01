import { createBrowserClient } from '@supabase/ssr';

// Browser client for /life client components (login only). Session lives in
// cookies so server components and proxy.ts see it.
export function createLifeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LIFE_SUPABASE_PUBLISHABLE_KEY!
  );
}
