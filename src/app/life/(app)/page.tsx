import { redirect } from 'next/navigation';

// /life opens on Today: the journal index sends on to today's date. The One
// Thing lives at /life/one-thing.
export default function LifeIndex() {
  redirect('/life/journal');
}
