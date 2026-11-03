import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { CurrentView } from '@/components/life/travel/CurrentView';
import { UpcomingView } from '@/components/life/travel/UpcomingView';
import { loadLiveTravel } from '@/components/life/travel/data';
import { todayKey } from '@/components/life/travel/format';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

// Travel opens on today when a trip is underway, otherwise on what is next.
export default async function TravelPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();
  const { current, upcoming, legs } = await loadLiveTravel(supabase, today);

  if (current) return <CurrentView trip={current} legs={legs.filter((l) => l.trip_id === current.id)} today={today} />;
  return <UpcomingView trips={upcoming} legs={legs} today={today} hasCurrent={false} />;
}
