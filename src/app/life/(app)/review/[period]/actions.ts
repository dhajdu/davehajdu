'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { addDays, isPeriod, periodEnd } from '@/lib/life/metrics';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function num(fd: FormData, key: string, min = -Infinity, max = Infinity): number | null {
  const s = str(fd, key);
  if (s === null) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${key} must be a number between ${min} and ${max}`);
  return n;
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
  refresh(period);
}

async function save(formData: FormData) {
  const { supabase } = await requireOwner();
  const reviewId = str(formData, 'review_id');
  const period = str(formData, 'period');
  if (!reviewId || !isPeriod(period)) throw new Error('Missing review');

  const { error } = await supabase
    .from('reviews')
    .update({ one_word: str(formData, 'one_word'), headline: str(formData, 'headline') })
    .eq('id', reviewId);
  if (error) throw new Error(error.message);

  const { data: areas, error: aErr } = await supabase.from('areas').select('id');
  if (aErr) throw new Error(aErr.message);
  const rows = (areas ?? []).map((a: { id: string }) => {
    const score = num(formData, `score_${a.id}`, 0, 10);
    return {
      review_id: reviewId,
      area_id: a.id,
      score: score === null ? null : Math.round(score * 10) / 10,
      feelings: str(formData, `feelings_${a.id}`),
      headline: str(formData, `headline_${a.id}`),
      impact: str(formData, `impact_${a.id}`),
    };
  });
  const { error: sErr } = await supabase.from('review_scores').upsert(rows, { onConflict: 'review_id,area_id' });
  if (sErr) throw new Error(sErr.message);
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

export async function addGoal(formData: FormData) {
  const { supabase } = await requireOwner();
  const reviewId = str(formData, 'review_id');
  const period = str(formData, 'period');
  const title = str(formData, 'title');
  const areaId = str(formData, 'area_id');
  const horizon = str(formData, 'horizon');
  if (!reviewId || !isPeriod(period)) throw new Error('Missing review');
  if (!title || !areaId) throw new Error('A goal needs a title and an area');
  if (horizon !== '30d' && horizon !== '60d') throw new Error('Horizon must be 30d or 60d');

  const metricId = str(formData, 'metric_id');
  const target = metricId ? num(formData, 'target_value') : null;

  const { error } = await supabase.from('goals').insert({
    review_id: reviewId,
    area_id: areaId,
    title,
    horizon,
    metric_id: metricId,
    target_value: target,
    due_on: addDays(periodEnd(period), horizon === '30d' ? 30 : 60),
    status: 'open',
  });
  if (error) throw new Error(error.message);
  refresh(period);
}

export async function setGoalStatus(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, 'goal_id');
  const period = str(formData, 'period');
  const status = str(formData, 'status');
  if (!id || !isPeriod(period)) throw new Error('Missing goal');
  if (!status || !['open', 'hit', 'missed', 'dropped'].includes(status)) throw new Error('Invalid status');
  const { error } = await supabase.from('goals').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh(period);
}
