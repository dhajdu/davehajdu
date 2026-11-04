import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOwnerContext } from '@/lib/life/auth';
import { lifeAdmin, startRun } from '@/lib/life/supabase-admin';
import {
  accessToken,
  deletePickerSession,
  fetchRendition,
  getPickerSession,
  GoogleDisconnected,
  listPickedItems,
  type PickedItem,
} from '@/lib/life/google-photos';

// Pulls what the owner picked into our bucket, a batch per call so the client
// can show progress and no single request runs long. Picker base URLs are
// only valid for about an hour, which is plenty for a batch loop.
export const maxDuration = 300;

const BATCH = 8;
const FULL = 1600;
const THUMB = 400;
const BUCKET = 'memories';

export async function POST(request: Request) {
  const ctx = await getOwnerContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  try {
    const token = await accessToken(ctx.user.id);
    const session = await getPickerSession(token, sessionId);
    if (!session.mediaItemsSet) return NextResponse.json({ ready: false });

    const picked = await listPickedItems(token, sessionId);
    const photos = picked.filter((m) => m.type === 'PHOTO');
    const skipped = picked.length - photos.length;

    const { data: have } = await ctx.supabase
      .from('memories')
      .select('google_media_id')
      .in('google_media_id', photos.map((p) => p.id));
    const haveIds = new Set((have ?? []).map((r) => r.google_media_id as string));
    const todo = photos.filter((p) => !haveIds.has(p.id));
    const batch = todo.slice(0, BATCH);

    for (const item of batch) await importOne(ctx.user.id, token, item, ctx.supabase);

    const remaining = todo.length - batch.length;
    if (remaining === 0) {
      await deletePickerSession(token, sessionId);
      const finish = await startRun('memories_import', 'google_photos');
      await finish({ itemsIn: picked.length, itemsOut: photos.length });
    }
    return NextResponse.json({ ready: true, imported: batch.length, remaining, skipped, total: photos.length });
  } catch (e) {
    const status = e instanceof GoogleDisconnected ? 409 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Import failed' }, { status });
  }
}

async function importOne(ownerId: string, token: string, item: PickedItem, db: SupabaseClient) {
  const year = item.createTime.slice(0, 4);
  const base = `${ownerId}/${year}/${item.id}`;
  const [full, thumb] = await Promise.all([fetchRendition(token, item.mediaFile.baseUrl, FULL), fetchRendition(token, item.mediaFile.baseUrl, THUMB)]);
  const ext = full.contentType.includes('png') ? 'png' : full.contentType.includes('webp') ? 'webp' : 'jpg';
  const storagePath = `${base}.${ext}`;
  const thumbPath = `${base}-thumb.${ext}`;

  const store = lifeAdmin.storage.from(BUCKET);
  const [a, b] = await Promise.all([
    store.upload(storagePath, full.bytes, { contentType: full.contentType, upsert: true }),
    store.upload(thumbPath, thumb.bytes, { contentType: thumb.contentType, upsert: true }),
  ]);
  if (a.error) throw new Error(a.error.message);
  if (b.error) throw new Error(b.error.message);

  const meta = item.mediaFile.mediaFileMetadata;
  const camera = [meta?.cameraMake, meta?.cameraModel].filter(Boolean).join(' ') || null;
  const { error } = await db.from('memories').insert({
    google_media_id: item.id,
    storage_path: storagePath,
    thumb_path: thumbPath,
    mime_type: full.contentType,
    width: meta?.width ?? null,
    height: meta?.height ?? null,
    taken_at: item.createTime,
    filename: item.mediaFile.filename ?? null,
    camera,
  });
  if (error) throw new Error(error.message);
}
