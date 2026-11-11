// Shared bits for /life scripts. Import it dynamically after the resolve hook
// in each script is registered (see the top of import-whoop.ts).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Tiny .env parser: KEY=value lines, optional quotes, # comments. Existing env wins.
export function loadEnv(file = join(process.cwd(), '.env.local')) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    process.env[m[1]] = v;
  }
}

export function adminFromEnv(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL;
  const key = process.env.LIFE_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_LIFE_SUPABASE_URL and LIFE_SUPABASE_SECRET_KEY must be set');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function ownerIdFrom(db: SupabaseClient): Promise<string> {
  const email = process.env.LIFE_OWNER_EMAIL?.toLowerCase();
  if (!email) throw new Error('LIFE_OWNER_EMAIL is not set');
  const { data, error } = await db.auth.admin.listUsers({ perPage: 50 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) throw new Error('Owner has not signed in to /life yet');
  return user.id;
}
