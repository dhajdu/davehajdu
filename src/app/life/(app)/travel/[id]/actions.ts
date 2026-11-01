'use server';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function updateTrip(formData: FormData, patch: Record<string, unknown>) {
  const { supabase } = await requireOwner();
  const id = String(formData.get('id') ?? '');
  if (!UUID.test(id)) throw new Error('Invalid trip id');
  const { error } = await supabase.from('trips').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/life/travel', 'layout');
}

// Renaming locks the title so the trip builder (W5) stops regenerating it.
export async function updateTripTitle(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim().slice(0, 200);
  if (!title) return;
  await updateTrip(formData, { title, title_locked: true });
}

export async function updateTripPurpose(formData: FormData) {
  const purpose = String(formData.get('purpose') ?? '');
  if (!['business', 'personal', 'unknown'].includes(purpose)) return;
  await updateTrip(formData, { purpose });
}

export async function updateTripNotes(formData: FormData) {
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 20_000);
  await updateTrip(formData, { notes: notes || null });
}
