import type { NextRequest } from 'next/server';
import { hasSecret } from '@/lib/life/auth';
import { isPeriod } from '@/lib/life/metrics';
import { buildReviewDraft, isFirstOfMonthICT, previousPeriodICT } from '@/lib/life/review';

// W6 monthly review draft. Scheduled daily at 23:00 UTC (06:00 ICT next day);
// it only does work when that ICT day is the 1st, unless ?period=YYYY-MM is given.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!hasSecret(request, 'CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const override = request.nextUrl.searchParams.get('period');
  if (override !== null && !isPeriod(override)) {
    return Response.json({ error: 'period must be YYYY-MM' }, { status: 400 });
  }
  if (override === null && !isFirstOfMonthICT()) {
    return Response.json({ skipped: true, reason: 'Not the 1st of the month in Asia/Ho_Chi_Minh' });
  }

  const period = override ?? previousPeriodICT();
  try {
    const result = await buildReviewDraft(period);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e), period }, { status: 500 });
  }
}
