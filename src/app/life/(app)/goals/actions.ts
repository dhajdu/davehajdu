'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function refresh() {
  revalidatePath('/life/goals');
  revalidatePath('/life');
}

// Five-year vision and this year's goals. Month and week goals stay in the journal.
export async function addLongGoal(formData: FormData) {
  const { supabase } = await requireOwner();
  const title = str(formData, 'title');
  const areaId = str(formData, 'area_id');
  const horizon = str(formData, 'horizon');
  if (!title || !areaId) throw new Error('A goal needs a title and an area');
  if (horizon !== 'vision' && horizon !== 'year' && horizon !== 'month') throw new Error('Horizon must be vision, year or month');
  const period = str(formData, 'period');
  if (horizon === 'month' && !/^\d{4}-\d{2}$/.test(period ?? '')) throw new Error('A month goal needs its month');
  const focus = str(formData, 'focus') === '1';

  const metricId = str(formData, 'metric_id');
  const targetRaw = metricId ? str(formData, 'target_value') : null;
  const target = targetRaw === null ? null : Number(targetRaw);
  if (target !== null && !Number.isFinite(target)) throw new Error('Target must be a number');

  const year = new Date().getUTCFullYear();
  const monthEnd = (p: string) => new Date(Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5, 7)), 0)).toISOString().slice(0, 10);
  if (horizon === 'month' && focus) {
    // One One Thing per month: the previous one becomes an ordinary goal.
    const { error: e } = await supabase.from('goals').update({ focus: false }).eq('horizon', 'month').eq('period', period!).eq('focus', true);
    if (e) throw new Error(e.message);
  }
  const { error } = await supabase.from('goals').insert({
    area_id: areaId,
    title,
    horizon,
    metric_id: metricId,
    target_value: target,
    due_on: horizon === 'year' ? `${year}-12-31` : horizon === 'month' ? monthEnd(period!) : `${year + 5}-12-31`,
    period: horizon === 'month' ? period : null,
    focus: horizon === 'month' && focus,
    status: 'open',
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function setLongGoalStatus(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, 'goal_id');
  const status = str(formData, 'status');
  if (!id || !status || !['open', 'behind', 'hit', 'missed', 'dropped'].includes(status)) throw new Error('Bad status');
  const { error } = await supabase.from('goals').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function renameLongGoal(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, 'goal_id');
  const title = str(formData, 'title');
  if (!id || !title) throw new Error('A goal needs a title');
  const { error } = await supabase.from('goals').update({ title }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh();
}
