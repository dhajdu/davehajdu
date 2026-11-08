'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { EMPTY_FIELDS, dayFields, dayTitle, getDay, getDayNumber, isDateKey, renderDay, type DayFields } from '@/lib/life/journal';
import { fieldsFromMarkdown } from '@/lib/life/focus-parse';
import { BLOOD_SUGAR, WEIGHT } from '@/lib/life/health';
import type { Db } from '@/lib/life/metrics';

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function dateOf(fd: FormData): string {
  const d = str(fd, 'date');
  if (!isDateKey(d)) throw new Error('Invalid date');
  return d;
}

function refresh(date: string) {
  revalidatePath(`/life/journal/${date}`);
  revalidatePath('/life/journal');
  revalidatePath('/life');
  revalidatePath('/life/timeline');
}

// Writes the day's fields: updates the app-written entry if there is one, else creates it.
async function writeDay(supabase: Db, date: string, fields: DayFields) {
  const dayNo = await getDayNumber(supabase, date);
  const row = { title: dayTitle(dayNo, fields), body_md: renderDay(fields), fields };

  const { data: existing } = await supabase.from('entries').select('id').eq('kind', 'journal').eq('entry_date', date).not('fields', 'is', null).limit(1);
  if (existing?.length) {
    const { error } = await supabase.from('entries').update(row).eq('id', existing[0].id);
    if (error) throw new Error(error.message);
  } else {
    const { data: area } = await supabase.from('areas').select('id').eq('slug', 'mind').single();
    const { error } = await supabase.from('entries').insert({ kind: 'journal', entry_date: date, area_id: area?.id ?? null, ...row });
    if (error) throw new Error(error.message);
  }
}

export async function saveDay(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const fields: DayFields = {
    one_thing: str(formData, 'one_thing').slice(0, 300),
    one_thing_health: str(formData, 'one_thing_health').slice(0, 300),
    gratitude: [str(formData, 'g1'), str(formData, 'g2'), str(formData, 'g3')].map((s) => s.slice(0, 500)),
    nhb: str(formData, 'nhb').slice(0, 20000),
  };
  await writeDay(supabase, date, fields);

  const weight = str(formData, 'weight');
  if (weight) {
    const kg = Number(weight);
    if (!Number.isFinite(kg) || kg < 30 || kg > 250) throw new Error('Weight must be in kg');
    await saveMeasurement(supabase, WEIGHT, date, kg);
  }
  const sugar = str(formData, 'blood_sugar');
  if (sugar) {
    const mgdl = Number(sugar);
    if (!Number.isFinite(mgdl) || mgdl < 20 || mgdl > 600) throw new Error('Blood sugar must be in mg/dL');
    await saveMeasurement(supabase, BLOOD_SUGAR, date, mgdl);
  }
  refresh(date);
}

async function saveMeasurement(supabase: Db, slug: string, date: string, value: number) {
  const { data: metric } = await supabase.from('metrics').select('id').eq('slug', slug).single();
  if (!metric) return;
  const { error } = await supabase.from('measurements').upsert({ metric_id: metric.id, measured_on: date, value }, { onConflict: 'owner_id,metric_id,measured_on' });
  if (error) throw new Error(error.message);
}

// One One Thing (health or business) from the ladder on Today; the rest of the
// day is kept. An empty text clears it.
export async function setOneThing(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const text = str(formData, 'one_thing').slice(0, 300);
  const track = str(formData, 'track');
  if (track !== 'health' && track !== 'business') throw new Error('Track must be health or business');
  const entry = await getDay(supabase, date);
  const current = dayFields(entry?.fields ?? (entry ? fieldsFromMarkdown(entry.body_md) : EMPTY_FIELDS));
  await writeDay(supabase, date, { ...current, [track === 'health' ? 'one_thing_health' : 'one_thing']: text });
  refresh(date);
}

export async function addTodo(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const title = str(formData, 'title').slice(0, 300);
  if (!title) return;
  const parent = str(formData, 'parent_id') || null;
  // A new item goes into today, at the end of today's list (just above the line).
  let planned: { planned_on: string; sort_order: number } | null = null;
  if (!parent) {
    const { data: last } = await supabase.from('todos').select('sort_order').order('sort_order', { ascending: false }).limit(1);
    planned = { planned_on: date, sort_order: (last?.[0]?.sort_order ?? 0) + 1 };
  }
  const { error } = await supabase.from('todos').insert({ title, parent_id: parent, added_on: date, ...planned });
  if (error) throw new Error(error.message);
  refresh(date);
}

export async function setTodoDone(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const id = str(formData, 'id');
  const done = str(formData, 'done') === '1';
  const { error } = await supabase.from('todos').update({ done_on: done ? date : null }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh(date);
}

// The list as dragged: `ids` in their new order, the first `todayCount` of
// them above the line (planned for `date`), the rest for another day.
export async function reorderTodos(date: string, ids: string[], todayCount: number) {
  const { supabase } = await requireOwner();
  if (!isDateKey(date)) throw new Error('Invalid date');
  if (!Array.isArray(ids) || ids.length > 500 || ids.some((id) => typeof id !== 'string')) throw new Error('Bad order');
  const above = Math.max(0, Math.min(ids.length, Math.floor(Number(todayCount))));
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('todos').update({ sort_order: i, planned_on: i < above ? date : null }).eq('id', id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  refresh(date);
}

export async function dropTodo(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const id = str(formData, 'id');
  const { error } = await supabase.from('todos').update({ dropped_on: date }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh(date);
}
