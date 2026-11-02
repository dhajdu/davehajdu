'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { dayTitle, getDayNumber, isDateKey, renderDay, type DayFields } from '@/lib/life/journal';
import { WEIGHT } from '@/lib/life/health';

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

export async function saveDay(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const fields: DayFields = {
    one_thing: str(formData, 'one_thing').slice(0, 300),
    gratitude: [str(formData, 'g1'), str(formData, 'g2'), str(formData, 'g3')].map((s) => s.slice(0, 500)),
    nhb: str(formData, 'nhb').slice(0, 20000),
  };
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

  const weight = str(formData, 'weight');
  if (weight) {
    const kg = Number(weight);
    if (!Number.isFinite(kg) || kg < 30 || kg > 250) throw new Error('Weight must be in kg');
    const { data: metric } = await supabase.from('metrics').select('id').eq('slug', WEIGHT).single();
    if (metric) {
      const { error } = await supabase.from('measurements').upsert({ metric_id: metric.id, measured_on: date, value: kg }, { onConflict: 'owner_id,metric_id,measured_on' });
      if (error) throw new Error(error.message);
    }
  }
  refresh(date);
}

export async function addTodo(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const title = str(formData, 'title').slice(0, 300);
  if (!title) return;
  const parent = str(formData, 'parent_id') || null;
  const { error } = await supabase.from('todos').insert({ title, parent_id: parent, added_on: date });
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

export async function dropTodo(formData: FormData) {
  const { supabase } = await requireOwner();
  const date = dateOf(formData);
  const id = str(formData, 'id');
  const { error } = await supabase.from('todos').update({ dropped_on: date }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh(date);
}
