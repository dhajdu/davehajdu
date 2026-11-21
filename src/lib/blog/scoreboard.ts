// One Person Company scoreboard: one row per post, from the Mahjong Tarot
// 05:15 daily report (company_os.daily_reports) for that day, plus Amazon
// book sales by order day (company_os.amazon_daily_sales). Add a row with each new post.

export type ScoreDay = {
  slug: string;
  day: number; // series day
  date: string; // report day, YYYY-MM-DD
  visits: number;
  leads: number;
  adSpendUsd: number;
  accounts: number;
  paidMembers: number;
  websiteSalesUsd: number;
  books: number; // Amazon units ordered that day
  booksTotal: number; // Amazon units ordered up to and including that day
};

export const GOAL = { paidMembers: 100, by: '2027-02-06', label: 'Lunar New Year' };

export const SCOREBOARD: ScoreDay[] = [
  {
    slug: 'one-person-company-day-2-getting-the-emails-out',
    day: 2, date: '2026-11-18',
    visits: 226, leads: 0, adSpendUsd: 3.83, accounts: 0, paidMembers: 0, websiteSalesUsd: 0,
    books: 0, booksTotal: 2,
  },
  {
    slug: 'one-person-company-day-3-rebuilding-the-product',
    day: 3, date: '2026-11-19',
    visits: 192, leads: 6, adSpendUsd: 55.01, accounts: 0, paidMembers: 0, websiteSalesUsd: 0,
    books: 4, booksTotal: 6,
  },
  {
    slug: 'one-person-company-day-4-the-morning-report',
    day: 4, date: '2026-11-20',
    visits: 154, leads: 12, adSpendUsd: 42.72, accounts: 1, paidMembers: 0, websiteSalesUsd: 0,
    books: 0, booksTotal: 6,
  },
];

// The rows up to and including this post, or null if the post has no row.
export function scoreboardFor(slug: string): ScoreDay[] | null {
  const i = SCOREBOARD.findIndex((d) => d.slug === slug);
  return i < 0 ? null : SCOREBOARD.slice(0, i + 1);
}
