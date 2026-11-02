'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { isPeriod } from '@/lib/life/metrics';
import { EO_MERPS, EO_SECTIONS, GOAL_STATUSES, buildReviewDraft, type EoUpdate, type GoalStatus } from '@/lib/life/review';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function refresh(period: string) {
  revalidatePath(`/life/review/${period}`);
  revalidatePath('/life/review');
  revalidatePath('/life');
}

export async function createReview(formData: FormData) {
  const period = str(formData, 'period');
  if (!isPeriod(period)) throw new Error('Invalid period');
  const { supabase } = await requireOwner();
  const { error } = await supabase.from('reviews').upsert({ period, status: 'draft' }, { onConflict: 'owner_id,period', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  await buildReviewDraft(period);
  refresh(period);
}

// Throws away the current text and has Claude draft the update again.
export async function redraftReview(formData: FormData) {
  const period = str(formData, 'period');
  if (!isPeriod(period)) throw new Error('Invalid period');
  await requireOwner();
  await buildReviewDraft(period, { force: true });
  refresh(period);
}

async function save(formData: FormData) {
  const { supabase } = await requireOwner();
  const reviewId = str(formData, 'review_id');
  const period = str(formData, 'period');
  if (!reviewId || !isPeriod(period)) throw new Error('Missing review');

  const { data: current, error: rErr } = await supabase.from('reviews').select('eo').eq('id', reviewId).single();
  if (rErr) throw new Error(rErr.message);
  const text = (key: string) => str(formData, key) ?? '';
  const eo: EoUpdate = {
    merps: Object.fromEntries(EO_MERPS.map(([k]) => [k, text(`merp_${k}`)])),
    struggle: text('struggle'),
    success: text('success'),
    updates: Object.fromEntries(
      EO_SECTIONS.map(([k]) => [k, { feelings: text(`feelings_${k}`), headline: text(`headline_${k}`), impact: text(`impact_${k}`) }])
    ),
    last_goals: formData
      .getAll('last_title')
      .map((t, i) => ({ title: String(t).trim(), status: str(formData, `last_status_${i}`) ?? '' }))
      .filter((g) => g.title)
      .map((g) => ({ title: g.title, status: (GOAL_STATUSES as readonly string[]).includes(g.status) ? (g.status as GoalStatus) : '' })),
    next_goals: { personal: text('next_personal'), business: text('next_business') },
    drafted_at: (current?.eo as EoUpdate | null)?.drafted_at,
    since: (current?.eo as EoUpdate | null)?.since,
    edited_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('reviews').update({ eo }).eq('id', reviewId);
  if (error) throw new Error(error.message);
  return { supabase, reviewId, period };
}

export async function saveReview(formData: FormData) {
  const { period } = await save(formData);
  refresh(period);
}

// Saves the form, then marks the review done.
export async function finishReview(formData: FormData) {
  const { supabase, reviewId, period } = await save(formData);
  const { error } = await supabase.from('reviews').update({ status: 'done' }).eq('id', reviewId);
  if (error) throw new Error(error.message);
  refresh(period);
}

export async function reopenReview(formData: FormData) {
  const { supabase } = await requireOwner();
  const reviewId = str(formData, 'review_id');
  const period = str(formData, 'period');
  if (!reviewId || !isPeriod(period)) throw new Error('Missing review');
  const { error } = await supabase.from('reviews').update({ status: 'draft' }).eq('id', reviewId);
  if (error) throw new Error(error.message);
  refresh(period);
}
