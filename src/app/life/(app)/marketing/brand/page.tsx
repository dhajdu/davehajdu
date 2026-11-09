import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { MarketingTabs } from '@/components/life/marketing/MarketingTabs';
import { BRAND } from '@/lib/blog/marketing';
import { saveBrandProfile } from '../actions';

export const metadata: Metadata = { title: 'Brand', robots: { index: false, follow: false } };

export default async function BrandPage() {
  const { supabase } = await requireOwner();
  const { data: brand, error } = await supabase.from('brands').select('id, name').eq('slug', BRAND).single();
  if (error) throw new Error(error.message);
  const { data: profile } = await supabase.from('brand_profiles').select('voice, audience, rules, banned_words').eq('brand_id', brand.id).maybeSingle();

  return (
    <div className="max-w-6xl">
      <PageHeader title="Brand" subtitle={`How ${brand.name} writes. The assistant reads this before it drafts.`} />
      <MarketingTabs active="brand" />
      <Card className="max-w-2xl">
        <form action={saveBrandProfile} className="grid gap-3">
          <input type="hidden" name="brand_id" value={brand.id} />
          <label className="grid gap-1 text-xs font-semibold text-muted">Voice<textarea name="voice" rows={4} defaultValue={profile?.voice ?? ''} /></label>
          <label className="grid gap-1 text-xs font-semibold text-muted">Audience<textarea name="audience" rows={3} defaultValue={profile?.audience ?? ''} /></label>
          <label className="grid gap-1 text-xs font-semibold text-muted">Rules<textarea name="rules" rows={4} defaultValue={profile?.rules ?? ''} /></label>
          <label className="grid gap-1 text-xs font-semibold text-muted">Banned words, one per line<textarea name="banned_words" rows={5} defaultValue={((profile?.banned_words as string[] | undefined) ?? []).join('\n')} /></label>
          <SaveButton className="life-btn is-primary" />
        </form>
      </Card>
    </div>
  );
}
