import { redirect } from 'next/navigation';
import { ictToday } from '@/lib/life/metrics';

export default function JournalIndex() {
  redirect(`/life/journal/${ictToday()}`);
}
