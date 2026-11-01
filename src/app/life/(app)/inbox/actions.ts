'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { applyProposal } from '@/lib/life/review-apply';
import { rebuildTrips } from '@/lib/life/trips';

async function resolve(id: string, status: 'approved' | 'rejected') {
  const { supabase } = await requireOwner();
  const { error } = await supabase
    .from('review_queue')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
}

export async function approveItem(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const { supabase, user } = await requireOwner();
  const { data: item, error } = await supabase
    .from('review_queue')
    .select('id, proposed, status')
    .eq('id', id)
    .single();
  if (error || !item) throw new Error('Inbox item not found');
  if (item.status !== 'pending') return;

  const proposal = await applyProposal(supabase, item.proposed);
  if (proposal.after === 'rebuild_trips') await rebuildTrips(supabase, user.id);

  await resolve(id, 'approved');
  revalidatePath('/life', 'layout');
}

export async function rejectItem(formData: FormData) {
  await resolve(String(formData.get('id') ?? ''), 'rejected');
  revalidatePath('/life', 'layout');
}
