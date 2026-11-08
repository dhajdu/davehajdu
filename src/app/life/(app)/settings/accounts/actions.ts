'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { ictToday } from '@/lib/life/metrics';
import { CATEGORIES, STATUSES } from './options';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, 500) : null;
}

// The inventory never holds a secret. A long run of digits in free text is
// almost always a card or bank account number, so it is turned away.
const LONG_NUMBER = /(?:\d[ -]?){12,}/;

export async function saveLogin(fd: FormData) {
  const { supabase } = await requireOwner();
  const id = str(fd, 'id');
  const name = str(fd, 'name');
  if (!name) throw new Error('Give the account a name');
  const category = str(fd, 'category') ?? 'other';
  const status = str(fd, 'status') ?? 'active';
  if (!CATEGORIES.includes(category as never) || !STATUSES.includes(status as never)) throw new Error('Invalid category or status');
  const last4 = str(fd, 'card_last4');
  if (last4 && !/^\d{4}$/.test(last4)) throw new Error('Card: the last four digits only');
  const expires = str(fd, 'card_expires');
  if (expires && !/^\d{4}-\d{2}$/.test(expires)) throw new Error('Card expiry must be a month');
  const login = str(fd, 'login');
  const notes = str(fd, 'notes');
  if ([login, notes].some((s) => s && LONG_NUMBER.test(s))) throw new Error('That looks like a card or account number. Keep it in the password manager.');

  const row = {
    name,
    entity: str(fd, 'entity') ?? 'Personal',
    category,
    status,
    login,
    url: str(fd, 'url'),
    vault_ref: str(fd, 'vault_ref'),
    has_2fa: fd.get('has_2fa') === 'on',
    card_last4: last4,
    card_expires: expires ? `${expires}-01` : null,
    member_number: str(fd, 'member_number'),
    notes,
    checked_on: ictToday(),
  };
  const { error } = id ? await supabase.from('logins').update(row).eq('id', id) : await supabase.from('logins').insert(row);
  if (error) throw new Error(error.message);
  revalidatePath('/life/settings/accounts');
}

export async function deleteLogin(fd: FormData) {
  const { supabase } = await requireOwner();
  const id = str(fd, 'id');
  if (!id) return;
  const { error } = await supabase.from('logins').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/life/settings/accounts');
}
