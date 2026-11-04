import { NextResponse } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { lifeAdmin } from '@/lib/life/supabase-admin';

// Opens the full-size copy of a memory: RLS proves it is the owner's, then a
// short signed URL is minted for the private bucket object.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: row } = await ctx.supabase.from('memories').select('storage_path').eq('id', id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await lifeAdmin.storage.from('memories').createSignedUrl(row.storage_path, 300);
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not sign' }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 302);
}
