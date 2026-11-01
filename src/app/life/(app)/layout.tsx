import { requireOwner } from '@/lib/life/auth';
import Sidebar from '@/components/life/Sidebar';

export default async function LifeAppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireOwner();
  const { count } = await supabase
    .from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="min-h-screen bg-white md:flex">
      <Sidebar pending={count ?? 0} />
      <div className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
