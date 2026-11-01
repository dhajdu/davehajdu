import { Manrope } from 'next/font/google';
import { requireOwner } from '@/lib/life/auth';
import Sidebar from '@/components/life/Sidebar';
import '../life.css';

// The Edge8 team portal's typeface.
const manrope = Manrope({ subsets: ['latin'], variable: '--life-font' });

export default async function LifeAppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireOwner();
  const { count } = await supabase
    .from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className={`life-shell ${manrope.variable}`}>
      <Sidebar pending={count ?? 0} />
      <main className="life-main">{children}</main>
    </div>
  );
}
