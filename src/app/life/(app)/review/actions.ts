'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/life/auth';
import { isPeriod } from '@/lib/life/metrics';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

// Saves the month-end review (all fields), creating the row on first save.
export async function saveMonthReview(formData: FormData) {
  const { supabase } = await requireOwner();
  const period = str(formData, 'period');
  if (!isPeriod(period)) throw new Error('Invalid month');
  const status = str(formData, 'status') === 'done' ? 'done' : 'draft';
  const row = {
    period,
    headline: str(formData, 'headline')?.slice(0, 200) ?? null,
    summary: str(formData, 'summary')?.slice(0, 1000) ?? null,
    grade_health: str(formData, 'grade_health')?.slice(0, 3) ?? null,
    grade_business: str(formData, 'grade_business')?.slice(0, 3) ?? null,
    health_md: str(formData, 'health_md') ?? '',
    business_md: str(formData, 'business_md') ?? '',
    moves_md: str(formData, 'moves_md') ?? '',
    numbers: (str(formData, 'numbers') ?? '').split(/\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 12),
    closing: str(formData, 'closing')?.slice(0, 300) ?? null,
    status,
  };
  const { error } = await supabase.from('month_reviews').upsert(row, { onConflict: 'owner_id,period' });
  if (error) throw new Error(error.message);
  revalidatePath(`/life/review/${period}`);
  revalidatePath('/life/review');
  revalidatePath('/life');
}
