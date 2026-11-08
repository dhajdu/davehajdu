import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { deleteAddress, saveAddress } from './actions';
import { KINDS } from './options';

export const metadata: Metadata = { title: 'Addresses', robots: { index: false, follow: false } };

type Address = {
  id: string;
  label: string;
  kind: (typeof KINDS)[number];
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  is_current: boolean;
  notes: string | null;
};

const KIND_LABEL: Record<Address['kind'], string> = { home: 'Home', family: 'Family', business: 'Business', mailing: 'Mailing', other: 'Other' };

function lines(a: Address): string[] {
  const place = [a.city, [a.region, a.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [a.line1, a.line2, place, a.country].filter((s): s is string => !!s);
}

function Fields({ a }: { a?: Address }) {
  const field = (name: keyof Address, label: string, wide = false) => (
    <label className={`grid gap-1 text-sm${wide ? ' sm:col-span-2' : ''}`}>
      <span className="font-semibold text-navy">{label}</span>
      <input name={name} defaultValue={(a?.[name] as string | null) ?? ''} autoComplete="off" required={name === 'label'} />
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      {field('label', 'Label (whose or what)')}
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Kind</span>
        <select name="kind" defaultValue={a?.kind ?? 'home'}>
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>
      {field('line1', 'Street', true)}
      {field('line2', 'Unit, floor, building', true)}
      {field('city', 'City')}
      {field('region', 'State or province')}
      {field('postal_code', 'Postal code')}
      {field('country', 'Country')}
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span className="font-semibold text-navy">Notes</span>
        <textarea name="notes" rows={2} defaultValue={a?.notes ?? ''} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_current" defaultChecked={a?.is_current ?? true} /> Current address
      </label>
    </div>
  );
}

// Settings › Addresses: Dave's own, family and company addresses, grouped by kind.
export default async function AddressesPage() {
  const { supabase } = await requireOwner();
  const { data } = await supabase.from('addresses').select('*').order('label');
  const all = (data ?? []) as Address[];

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Addresses" subtitle="Home, family and company addresses in one place" />

      <details className="life-card">
        <summary className="cursor-pointer font-semibold text-navy">Add an address</summary>
        <form action={saveAddress} className="mt-4 space-y-4">
          <Fields />
          <SaveButton className={`${primaryButtonClass} py-2 text-sm`}>Add</SaveButton>
        </form>
      </details>

      {all.length === 0 && <EmptyState>No addresses yet.</EmptyState>}

      {KINDS.map((kind) => {
        const rows = all.filter((a) => a.kind === kind).sort((x, y) => Number(y.is_current) - Number(x.is_current));
        if (!rows.length) return null;
        return (
          <Card key={kind} title={KIND_LABEL[kind]}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {rows.map((a) => (
                <li key={a.id} className={a.is_current ? '' : 'opacity-60'}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{a.label}</span>
                    {!a.is_current && <Chip>Old</Chip>}
                  </div>
                  <address className="not-italic text-sm text-body-text">
                    {lines(a).map((s) => <div key={s}>{s}</div>)}
                  </address>
                  {a.notes && <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{a.notes}</p>}
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm font-semibold text-blue">Edit</summary>
                    <form action={saveAddress} className="mt-3 space-y-4">
                      <Fields a={a} />
                      <div className="flex gap-2">
                        <SaveButton className={`${primaryButtonClass} py-2 text-sm`} />
                        <button formAction={deleteAddress} className={`${buttonClass} py-2 text-sm`}>Delete</button>
                      </div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
