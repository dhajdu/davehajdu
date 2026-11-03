import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { UpcomingView } from '@/components/life/travel/UpcomingView';
import { loadLiveTravel } from '@/components/life/travel/data';
import { todayKey } from '@/components/life/travel/format';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

export default async function TravelUpcomingPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();
  const { current, upcoming, legs } = await loadLiveTravel(supabase, today);
  return <UpcomingView trips={upcoming} legs={legs} today={today} hasCurrent={current !== null} />;
}
