'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { addDays, ictToday } from '@/lib/life/metrics';
import { VISION_TITLE, renderVision, type VisionFields } from '@/lib/life/vision';

const monthEnd = (p: string) => new Date(Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5, 7)), 0)).toISOString().slice(0, 10);

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function refresh() {
  revalidatePath('/life/goals');
  revalidatePath('/life/one-thing');
}

function trackOf(fd: FormData): 'health' | 'business' {
  const t = str(fd, 'track') ?? 'business';
  if (t !== 'health' && t !== 'business') throw new Error('Track must be health or business');
  return t;
}

// Five-year vision and this year's goals. Month and week goals stay in the journal.
export async function addLongGoal(formData: FormData) {
  const { supabase } = await requireOwner();
  const title = str(formData, 'title');
  const areaId = str(formData, 'area_id');
  const horizon = str(formData, 'horizon');
  if (!title || !areaId) throw new Error('A goal needs a title and an area');
  if (horizon !== 'vision' && horizon !== 'year' && horizon !== 'month' && horizon !== 'week') throw new Error('Horizon must be vision, year, month or week');
  const period = str(formData, 'period');
  if (horizon === 'month' && !/^\d{4}-\d{2}$/.test(period ?? '')) throw new Error('A month goal needs its month');
  if (horizon === 'week' && !/^\d{4}-\d{2}-\d{2}$/.test(period ?? '')) throw new Error('A week goal needs its Monday');
  const focus = str(formData, 'focus') === '1';
  const track = trackOf(formData);

  const metricId = str(formData, 'metric_id');
  const targetRaw = metricId ? str(formData, 'target_value') : null;
  const target = targetRaw === null ? null : Number(targetRaw);
  if (target !== null && !Number.isFinite(target)) throw new Error('Target must be a number');

  const year = new Date().getUTCFullYear();
  if (horizon === 'month' && focus) {
    // One One Thing per month and track: the previous one becomes an ordinary goal.
    const { error: e } = await supabase.from('goals').update({ focus: false }).eq('horizon', 'month').eq('period', period!).eq('track', track).eq('focus', true);
    if (e) throw new Error(e.message);
  }
  const { error } = await supabase.from('goals').insert({
    area_id: areaId,
    title,
    horizon,
    track,
    metric_id: metricId,
    target_value: target,
    due_on: horizon === 'year' ? `${year}-12-31` : horizon === 'month' ? monthEnd(period!) : horizon === 'week' ? addDays(period!, 6) : `${year + 5}-12-31`,
    period: horizon === 'month' || horizon === 'week' ? period : null,
    focus: horizon === 'month' && focus,
    status: 'open',
  });
  if (error) throw new Error(error.message);
  refresh();
}

// The One Thing for this week or this month on one track, typed straight into
// the ladder. Replaces that track's previous One Thing for the period (it
// stays as an ordinary goal).
export async function setFocusGoal(formData: FormData) {
  const { supabase } = await requireOwner();
  const title = str(formData, 'title');
  const horizon = str(formData, 'horizon');
  const period = str(formData, 'period');
  const track = trackOf(formData);
  if (!title) return;
  if (horizon !== 'week' && horizon !== 'month') throw new Error('Horizon must be week or month');
  if (!period || !(horizon === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(period)) throw new Error('Bad period');

  const { error: e } = await supabase.from('goals').update({ focus: false }).eq('horizon', horizon).eq('period', period).eq('track', track).eq('focus', true);
  if (e) throw new Error(e.message);
  const { error } = await supabase.from('goals').insert({
    title: title.slice(0, 200),
    horizon,
    track,
    period,
    focus: true,
    due_on: horizon === 'month' ? monthEnd(period) : addDays(period, 6),
    status: 'open',
  });
  if (error) throw new Error(error.message);
  refresh();
}

// The five-year vision: statement, core values (one per line), the picture in
// prose. One reference entry, updated in place.
export async function saveVision(formData: FormData) {
  const { supabase } = await requireOwner();
  const fields: VisionFields = {
    statement: (str(formData, 'statement') ?? '').slice(0, 200),
    values: (str(formData, 'values') ?? '').split('\n').map((v) => v.trim()).filter(Boolean).slice(0, 20),
    picture: (str(formData, 'picture') ?? '').slice(0, 20000),
  };
  const row = { fields, body_md: renderVision(fields) };
  const { data: existing } = await supabase.from('entries').select('id').eq('kind', 'reference').eq('title', VISION_TITLE).not('fields', 'is', null).limit(1);
  if (existing?.length) {
    const { error } = await supabase.from('entries').update(row).eq('id', existing[0].id);
    if (error) throw new Error(error.message);
  } else {
    const { data: area } = await supabase.from('areas').select('id').eq('slug', 'direction').maybeSingle();
    const { error } = await supabase.from('entries').insert({ kind: 'reference', entry_date: ictToday(), title: VISION_TITLE, area_id: area?.id ?? null, ...row });
    if (error) throw new Error(error.message);
  }
  refresh();
  revalidatePath('/life/journal', 'layout');
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
