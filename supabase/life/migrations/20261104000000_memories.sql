-- Memories: photos picked from Google Photos and kept in our own bucket.
-- Google closed whole-library access in March 2025, so import goes through
-- the Picker: the owner chooses a batch, we download web-sized copies.
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  google_media_id text not null,
  storage_path text not null,
  thumb_path text not null,
  mime_type text not null,
  width int,
  height int,
  taken_at timestamptz not null,
  filename text,
  camera text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, google_media_id)
);
comment on table public.memories is 'Photos imported from Google Photos via the Picker API, stored web-sized in the memories bucket.';
comment on column public.memories.google_media_id is 'Google Photos media item id; the dedupe key per owner.';
comment on column public.memories.storage_path is 'Object path in the memories bucket, 1600px on the long side.';
comment on column public.memories.thumb_path is 'Object path in the memories bucket, 400px on the long side.';
comment on column public.memories.taken_at is 'Google createTime: when the photo was taken.';
create index memories_owner_taken on public.memories (owner_id, taken_at desc);

alter table public.memories enable row level security;
create policy memories_owner on public.memories for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy memories_reader on public.memories for select to life_reader using (owner_id = (select auth.uid()));
create trigger memories_touch before update on public.memories for each row execute function public.life_touch_updated_at();
grant select on public.memories to life_reader;

-- OAuth tokens for third-party accounts. Service role only: RLS is on with no
-- policies, so neither the browser nor life_reader can read a refresh token.
create table public.integrations (
  owner_id uuid not null references auth.users(id),
  provider text not null,
  account_email text,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, provider)
);
comment on table public.integrations is 'OAuth refresh tokens per provider (google_photos). Read and written only with the secret key.';
alter table public.integrations enable row level security;
create trigger integrations_touch before update on public.integrations for each row execute function public.life_touch_updated_at();

-- The bucket, private. Objects live under {owner_id}/{yyyy}/{media_id}[-thumb].jpg.
insert into storage.buckets (id, name, public, file_size_limit)
values ('memories', 'memories', false, 10485760)
on conflict (id) do nothing;

-- Shows up on the Sources page like the other feeds; cadence is manual.
insert into public.sources (slug, name, method, cadence, enabled)
values ('google_photos', 'Google Photos', 'Picker import', 'on demand', true)
on conflict (slug) do nothing;
