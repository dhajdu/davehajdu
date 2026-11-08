-- Settings › Accounts and Settings › Addresses.
-- logins is an inventory of every online account (what it is, who it belongs
-- to, keep or close), not a vault: passwords, PINs, card numbers, account
-- numbers, keys and recovery codes live in the password manager, and
-- vault_ref says where. (public.accounts is taken: it holds money accounts
-- for balances.)
-- Neither table is granted to life_reader, so Ask cannot read them.

create table public.logins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  entity text not null default 'Personal',
  category text not null default 'other' check (category in ('bank','card','government','travel','work','dev','social','shopping','utility','other')),
  login text,
  url text,
  vault_ref text,
  has_2fa boolean not null default false,
  status text not null default 'active' check (status in ('active','rotate','close','closed')),
  card_last4 text check (card_last4 ~ '^[0-9]{4}$'),
  card_expires date,
  member_number text,
  checked_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.logins is 'Inventory of online accounts. Never holds a secret; the password manager does.';
comment on column public.logins.entity is 'Who the account belongs to: Personal or a company (Edge8 AI, Startup Success, AIO, In The Know, ...).';
comment on column public.logins.login is 'Username or sign-in email. Not the password.';
comment on column public.logins.vault_ref is 'Where the secret lives, e.g. "1Password › Chase AIO".';
comment on column public.logins.status is 'active; rotate = change the password; close = shut the account down; closed = done.';
comment on column public.logins.card_last4 is 'Last four digits of a card, never the full number.';
comment on column public.logins.card_expires is 'First day of the card expiry month.';
comment on column public.logins.member_number is 'Loyalty or membership number (airline, hotel, car rental).';
comment on column public.logins.checked_on is 'When the entry was last confirmed correct.';
create index logins_owner on public.logins (owner_id, entity, name);

alter table public.logins enable row level security;
create policy logins_owner on public.logins for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create trigger logins_touch before update on public.logins for each row execute function public.life_touch_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  label text not null,
  kind text not null default 'home' check (kind in ('home','family','business','mailing','other')),
  line1 text,
  line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  is_current boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.addresses is 'Postal addresses: Dave''s own, family, and company registered addresses.';
comment on column public.addresses.label is 'Whose or what address, e.g. "Dad" or "Edge8 AI (registered)".';
comment on column public.addresses.region is 'State or province.';
comment on column public.addresses.is_current is 'False for an old address kept for the record.';
create index addresses_owner on public.addresses (owner_id, kind, label);

alter table public.addresses enable row level security;
create policy addresses_owner on public.addresses for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create trigger addresses_touch before update on public.addresses for each row execute function public.life_touch_updated_at();
