import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client. Uses the secret key, which bypasses RLS.
// NEVER import this from a client component — the secret key must not be
// bundled into the browser.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn(
    'Supabase env vars not configured (SUPABASE_URL / SUPABASE_SECRET_KEY). Database features will not work.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseSecretKey || 'placeholder-key',
  {
    auth: { persistSession: false },
  }
);
