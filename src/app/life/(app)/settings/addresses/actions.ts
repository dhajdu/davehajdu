'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { KINDS } from './options';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, 500) : null;
}

export async function saveAddress(fd: FormData) {
  const { supabase } = await requireOwner();
  const id = str(fd, 'id');
  const label = str(fd, 'label');
  if (!label) throw new Error('Give the address a label');
  const kind = str(fd, 'kind') ?? 'home';
  if (!KINDS.includes(kind as never)) throw new Error('Invalid kind');

  const row = {
    label,
    kind,
    line1: str(fd, 'line1'),
    line2: str(fd, 'line2'),
    city: str(fd, 'city'),
    region: str(fd, 'region'),
    postal_code: str(fd, 'postal_code'),
    country: str(fd, 'country'),
    is_current: fd.get('is_current') === 'on',
    notes: str(fd, 'notes'),
  };
  const { error } = id ? await supabase.from('addresses').update(row).eq('id', id) : await supabase.from('addresses').insert(row);
  if (error) throw new Error(error.message);
  revalidatePath('/life/settings/addresses');
}

export async function deleteAddress(fd: FormData) {
  const { supabase } = await requireOwner();
  const id = str(fd, 'id');
  if (!id) return;
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/life/settings/addresses');
}
