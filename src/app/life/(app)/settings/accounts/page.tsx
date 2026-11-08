import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { formatDate, ictToday } from '@/lib/life/metrics';
import { deleteLogin, saveLogin } from './actions';
import { CATEGORIES, STATUSES, STATUS_LABEL } from './options';

export const metadata: Metadata = { title: 'Accounts', robots: { index: false, follow: false } };

type Login = {
  id: string;
  name: string;
  entity: string;
  category: string;
  login: string | null;
  url: string | null;
  vault_ref: string | null;
  has_2fa: boolean;
  status: (typeof STATUSES)[number];
  card_last4: string | null;
  card_expires: string | null;
  member_number: string | null;
  checked_on: string | null;
  notes: string | null;
};

const VIEWS = { open: 'Open', todo: 'To do', closed: 'Closed' } as const;
type View = keyof typeof VIEWS;

function expired(l: Login, today: string) {
  return !!l.card_expires && l.card_expires < `${today.slice(0, 7)}-01`;
}

// Something to do: a password to change, an account to close, a card past its
// expiry, or a secret not yet in the password manager.
function needsWork(l: Login, today: string) {
  return l.status === 'rotate' || l.status === 'close' || expired(l, today) || !l.vault_ref;
}

function Fields({ l, entities }: { l?: Login; entities: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {l && <input type="hidden" name="id" value={l.id} />}
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Name</span>
        <input name="name" required defaultValue={l?.name} placeholder="Chase Business Checking" autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Belongs to</span>
        <input name="entity" list="login-entities" defaultValue={l?.entity ?? 'Personal'} autoComplete="off" />
        <datalist id="login-entities">
          {entities.map((e) => <option key={e} value={e} />)}
        </datalist>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Category</span>
        <select name="category" defaultValue={l?.category ?? 'other'}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Status</span>
        <select name="status" defaultValue={l?.status ?? 'active'}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Login (username or email)</span>
        <input name="login" defaultValue={l?.login ?? ''} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Password manager item</span>
        <input name="vault_ref" defaultValue={l?.vault_ref ?? ''} placeholder="1Password › Chase AIO" autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Website</span>
        <input name="url" type="url" defaultValue={l?.url ?? ''} placeholder="https://" autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Member or loyalty number</span>
        <input name="member_number" defaultValue={l?.member_number ?? ''} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Card, last 4 digits</span>
        <input name="card_last4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={l?.card_last4 ?? ''} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-navy">Card expires</span>
        <input name="card_expires" type="month" defaultValue={l?.card_expires?.slice(0, 7) ?? ''} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span className="font-semibold text-navy">Notes</span>
        <textarea name="notes" rows={2} defaultValue={l?.notes ?? ''} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="has_2fa" defaultChecked={l?.has_2fa} /> Two-factor is on
      </label>
    </div>
  );
}

// Settings › Accounts: every online account, who it belongs to and what to do
// with it. The secrets stay in the password manager; this page says where.
export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const requested = (await searchParams).view ?? '';
  const view: View = requested in VIEWS ? (requested as View) : 'open';
  const { data } = await supabase.from('logins').select('*').order('name');
  const all = (data ?? []) as Login[];
  const entities = [...new Set(['Personal', ...all.map((l) => l.entity)])].sort();

  const shown = all.filter((l) => (view === 'closed' ? l.status === 'closed' : l.status !== 'closed' && (view === 'open' || needsWork(l, today))));
  const groups = new Map<string, Login[]>();
  for (const l of shown) groups.set(l.entity, [...(groups.get(l.entity) ?? []), l]);
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === 'Personal' ? -1 : b === 'Personal' ? 1 : a.localeCompare(b)));
  const todo = all.filter((l) => l.status !== 'closed' && needsWork(l, today)).length;

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title="Accounts"
        subtitle="Every login, who it belongs to and what to do with it. Passwords live in the password manager, never here."
        actions={
          <nav className="life-seg" aria-label="Show">
            {(Object.keys(VIEWS) as View[]).map((v) => (
              <Link key={v} href={`/life/settings/accounts?view=${v}`} aria-current={v === view ? 'page' : undefined}>
                {VIEWS[v]}{v === 'todo' && todo > 0 ? ` (${todo})` : ''}
              </Link>
            ))}
          </nav>
        }
      />

      <details className="life-card">
        <summary className="cursor-pointer font-semibold text-navy">Add an account</summary>
        <form action={saveLogin} className="mt-4 space-y-4">
          <Fields entities={entities} />
          <SaveButton className={`${primaryButtonClass} py-2 text-sm`}>Add</SaveButton>
        </form>
      </details>

      {ordered.length === 0 && <EmptyState>{view === 'todo' ? 'Nothing to do.' : 'No accounts here yet.'}</EmptyState>}

      {ordered.map(([entity, rows]) => (
        <Card key={entity} title={`${entity} · ${rows.length}`}>
          <ul className="divide-y divide-border">
            {rows.map((l) => (
              <li key={l.id} className="py-2 first:pt-0 last:pb-0">
                <details>
                  <summary className="cursor-pointer list-none flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-navy">{l.name}</span>
                    {l.login && <span className="text-sm text-muted">{l.login}</span>}
                    <span className="flex flex-wrap gap-1.5 ml-auto">
                      <Chip>{l.category}</Chip>
                      {l.status !== 'active' && <Chip tone={l.status === 'closed' ? 'gray' : 'magenta'}>{STATUS_LABEL[l.status]}</Chip>}
                      {l.card_last4 && (
                        <Chip tone={expired(l, today) ? 'magenta' : 'gray'}>
                          ••{l.card_last4}{l.card_expires ? ` ${expired(l, today) ? 'expired' : 'exp'} ${formatDate(l.card_expires, { month: 'short', year: '2-digit' })}` : ''}
                        </Chip>
                      )}
                      {l.status !== 'closed' && !l.vault_ref && <Chip tone="blue">Not in vault</Chip>}
                      {l.has_2fa && <Chip tone="mint">2FA</Chip>}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                      {l.vault_ref && (<><dt className="text-muted">Vault</dt><dd>{l.vault_ref}</dd></>)}
                      {l.member_number && (<><dt className="text-muted">Member no.</dt><dd>{l.member_number}</dd></>)}
                      {l.url && (<><dt className="text-muted">Website</dt><dd><a href={l.url} target="_blank" rel="noreferrer" className="text-blue">{l.url}</a></dd></>)}
                      {l.notes && (<><dt className="text-muted">Notes</dt><dd className="whitespace-pre-wrap">{l.notes}</dd></>)}
                      {l.checked_on && (<><dt className="text-muted">Checked</dt><dd>{formatDate(l.checked_on)}</dd></>)}
                    </dl>
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold text-blue">Edit</summary>
                      <form action={saveLogin} className="mt-3 space-y-4">
                        <Fields l={l} entities={entities} />
                        <div className="flex gap-2">
                          <SaveButton className={`${primaryButtonClass} py-2 text-sm`} />
                          <button formAction={deleteLogin} className={`${buttonClass} py-2 text-sm`}>Delete</button>
                        </div>
                      </form>
                    </details>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
