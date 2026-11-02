import 'server-only';
import type { Db } from './metrics';

// The month-end review in Dave's format: health graded first, then business,
// then next month's moves. One row per month in `month_reviews`.
export type MonthReview = {
  id: string;
  period: string;
  headline: string | null;
  summary: string | null;
  grade_health: string | null;
  grade_business: string | null;
  health_md: string;
  business_md: string;
  moves_md: string;
  numbers: string[];
  closing: string | null;
  status: 'draft' | 'done';
  updated_at: string;
};

export const MONTH_REVIEW_COLUMNS = 'id, period, headline, summary, grade_health, grade_business, health_md, business_md, moves_md, numbers, closing, status, updated_at';

export async function getMonthReviews(db: Db): Promise<MonthReview[]> {
  const { data, error } = await db.from('month_reviews').select(MONTH_REVIEW_COLUMNS).order('period', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MonthReview[];
}

export async function getMonthReview(db: Db, period: string): Promise<MonthReview | null> {
  const { data, error } = await db.from('month_reviews').select(MONTH_REVIEW_COLUMNS).eq('period', period).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MonthReview | null) ?? null;
}

// Letter grades read as a tone: A and B are fine, C is a warning, D and F are a miss.
export function gradeTone(g: string | null): 'good' | 'warn' | 'bad' | 'none' {
  if (!g) return 'none';
  const l = g.trim()[0]?.toUpperCase();
  return l === 'A' || l === 'B' ? 'good' : l === 'C' ? 'warn' : 'bad';
}
