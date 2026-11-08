'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
  if (!['business', 'eo', 'personal', 'unknown'].includes(purpose)) return;
  await updateTrip(formData, { purpose });
}

export async function updateTripNotes(formData: FormData) {
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 20_000);
  await updateTrip(formData, { notes: notes || null });
}

// Deleting a trip cancels its bookings too; otherwise the next trip rebuild
// would group the same legs into the trip again.
export async function deleteTrip(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get('id') ?? '');
  if (!UUID.test(id)) throw new Error('Invalid trip id');
  const legs = await supabase.from('trip_legs').update({ status: 'cancelled', trip_id: null }).eq('trip_id', id);
  if (legs.error) throw new Error(legs.error.message);
  const links = await supabase.from('links').delete().eq('from_type', 'trips').eq('from_id', id);
  if (links.error) throw new Error(links.error.message);
  const trip = await supabase.from('trips').delete().eq('id', id);
  if (trip.error) throw new Error(trip.error.message);
  revalidatePath('/life/travel', 'layout');
  redirect('/life/travel');
}
