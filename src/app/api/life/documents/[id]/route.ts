import { NextResponse } from 'next/server';
import { getOwnerContext } from '@/lib/life/auth';
import { lifeAdmin } from '@/lib/life/supabase-admin';

// Opens a private document: the owner's session proves the row is theirs
// (RLS), then a five-minute signed URL is minted for the bucket object.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: doc } = await ctx.supabase.from('documents').select('storage_path').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await lifeAdmin.storage.from('life-files').createSignedUrl(doc.storage_path, 300);
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not sign' }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 302);
}
