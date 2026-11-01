-- /life base schema (Supabase project dave-life). See docs/architecture/life.md.
-- Owner-scoped tables carry owner_id and an owner-only RLS policy.
-- Frame tables (areas, metrics, sources) are shared config: readable by the
-- signed-in owner, written only by the service role.

create extension if not exists pgcrypto;

-- Only one person may ever sign up.
create or replace function public.life_only_owner_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) <> 'dhajdu@gmail.com' then
    raise exception 'Sign-ups are closed';
  end if;
  return new;
end $$;

create trigger life_only_owner_signup
  before insert on auth.users
  for each row execute function public.life_only_owner_signup();

create or replace function public.life_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ===== Frame =====

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.areas is 'The ten areas of a life. Every record, metric, entry and goal belongs to one.';

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  method text not null,
  cadence text not null,
  enabled boolean not null default true,
  last_run_at timestamptz,
  last_status text,
  cursor jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.sources is 'Connector registry: where data comes from, how often, and when it last ran.';
comment on column public.sources.cursor is 'Connector resume state, e.g. Gmail backfill window.';

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id),
  slug text unique not null,
  name text not null,
  unit text,
  aggregation text not null check (aggregation in ('avg','sum','last')),
  direction text not null check (direction in ('higher_better','lower_better','target')),
  source_id uuid references public.sources(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.metrics is 'Definitions of things measured over time. Values live in measurements.';
comment on column public.metrics.aggregation is 'How daily values roll up to a month: avg, sum or last.';

-- ===== Owner-scoped tables =====

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.taggables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  tag_id uuid not null references public.tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id)
);
comment on table public.taggables is 'Polymorphic tag links. entity_type is a table name.';

create table public.source_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  source_id uuid not null references public.sources(id),
  external_id text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null,
  processed_at timestamptz,
  extraction jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);
comment on table public.source_items is 'Raw inbox: one row per email, Notion page, health day or file received. Never duplicated.';
comment on column public.source_items.external_id is 'Id in the source system, e.g. Gmail message id or Notion page id.';

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  city text,
  country text,
  lat double precision,
  lng double precision,
  kind text not null check (kind in ('home','hotel','airport','venue','city')),
  iata text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index places_owner_iata on public.places (owner_id, iata) where iata is not null;
comment on column public.places.iata is 'Airport code when kind = airport, e.g. SGN.';

create table public.records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  area_id uuid not null references public.areas(id),
  kind text not null,
  title text not null,
  started_on date,
  ended_on date,
  date_precision text not null default 'day' check (date_precision in ('day','month','year','approx')),
  place_id uuid references public.places(id),
  notes text,
  source_item_id uuid references public.source_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.records is 'Things that happened: surgeries, jobs, moves, milestones. The timeline.';
comment on column public.records.kind is 'surgery, job, company, move, milestone, family, etc.';

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  metric_id uuid not null references public.metrics(id),
  measured_on date not null,
  value numeric not null,
  source_item_id uuid references public.source_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, metric_id, measured_on)
);
comment on table public.measurements is 'One value per metric per day.';

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  area_id uuid references public.areas(id),
  kind text not null check (kind in ('journal','eo_update','learning','presentation','reference','note')),
  entry_date date not null,
  title text,
  body_md text not null default '',
  external_id text,
  notion_tags text[] not null default '{}',
  search tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_md,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, external_id)
);
create index entries_search on public.entries using gin (search);
create index entries_date on public.entries (entry_date);
comment on table public.entries is 'Reflections: journal entries, EO updates, forum learnings, presentations, notes.';
comment on column public.entries.external_id is 'Notion page id (or page id + block key for split learnings).';

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  one_word text,
  headline text,
  status text not null default 'draft' check (status in ('draft','done')),
  auto_summary jsonb not null default '{}',
  entry_id uuid references public.entries(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, period)
);
comment on table public.reviews is 'Monthly life review. period is YYYY-MM. Imported EO updates become reviews.';

create table public.review_scores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  review_id uuid not null references public.reviews(id) on delete cascade,
  area_id uuid not null references public.areas(id),
  score numeric(3,1) check (score between 0 and 10),
  feelings text,
  headline text,
  impact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, area_id)
);
comment on column public.review_scores.score is '0 to 10. EO mapping: Physical=body, Mental=mind, Financial=money, Friends/Family=people, Professional=work.';

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  area_id uuid not null references public.areas(id),
  title text not null,
  horizon text not null check (horizon in ('30d','60d','year','vision')),
  metric_id uuid references public.metrics(id),
  target_value numeric,
  due_on date,
  status text not null default 'open' check (status in ('open','hit','missed','dropped')),
  review_id uuid references public.reviews(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.goals.review_id is 'The review in which the goal was set.';

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  title text not null,
  title_locked boolean not null default false,
  start_on date not null,
  end_on date,
  primary_place_id uuid references public.places(id),
  purpose text not null default 'unknown' check (purpose in ('business','personal','unknown')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.trips is 'A trip runs from leaving Saigon (SGN) to returning. Built from trip_legs.';

create table public.trip_legs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  trip_id uuid references public.trips(id) on delete set null,
  kind text not null check (kind in ('flight','hotel','train','car','event')),
  status text not null default 'confirmed' check (status in ('confirmed','changed','cancelled')),
  confirmation_code text,
  provider text,
  number text,
  origin_place_id uuid references public.places(id),
  destination_place_id uuid references public.places(id),
  starts_at timestamptz not null,
  start_tz text not null,
  ends_at timestamptz,
  end_tz text,
  address text,
  leg_key text not null,
  source_item_id uuid references public.source_items(id),
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, leg_key)
);
comment on table public.trip_legs is 'Flights, hotel stays, trains, cars and events. Times stored in UTC with the local IANA timezone alongside.';
comment on column public.trip_legs.leg_key is 'Natural dedupe key: kind|confirmation_code|number|local start date.';

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  relationship text,
  closeness int check (closeness between 1 and 5),
  how_met text,
  birthday date,
  contact jsonb not null default '{}',
  contact_every_days int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  person_id uuid not null references public.people(id) on delete cascade,
  happened_at timestamptz not null,
  kind text not null check (kind in ('meeting','call','trip','message')),
  record_id uuid references public.records(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  institution text,
  kind text not null check (kind in ('bank','card','brokerage','loan','property','crypto')),
  currency text not null default 'USD',
  is_liability boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.balances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  account_id uuid not null references public.accounts(id) on delete cascade,
  as_of date not null,
  balance numeric not null,
  balance_usd numeric,
  fx_rate numeric,
  source_item_id uuid references public.source_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, as_of)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  storage_path text not null,
  mime text,
  title text,
  doc_date date,
  text text,
  source_item_id uuid references public.source_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.documents.storage_path is 'Path in the private life-files bucket. Open only via signed URL.';

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  title text not null,
  kind text,
  expires_on date,
  renews_on date,
  remind_days_before int not null default 30,
  document_id uuid references public.documents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  storage_path text not null,
  taken_at timestamptz,
  place_id uuid references public.places(id),
  caption text,
  width int,
  height int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  relation text not null check (relation in ('mentions','attached','during','with')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_type, from_id, to_type, to_id, relation)
);
comment on table public.links is 'Generic relations, e.g. trip --during--> journal entry, record --attached--> document.';

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  source_item_id uuid references public.source_items(id),
  area_id uuid references public.areas(id),
  kind text not null,
  proposed jsonb not null,
  confidence numeric,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','edited')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.review_queue is 'Inbox: extractions that are low confidence, conflicting or anomalous wait here for the owner.';

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  workflow text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','ok','error')),
  items_in int not null default 0,
  items_out int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Read-only role for Ask =====

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'life_reader') then
    create role life_reader nologin noinherit;
  end if;
end $$;
grant life_reader to authenticated;
grant usage on schema public to life_reader;

-- ===== RLS, triggers, grants =====

do $$
declare t text;
begin
  foreach t in array array['areas','sources','metrics'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated, life_reader using (true)', t || '_read', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.life_touch_updated_at()', t || '_touch', t);
    execute format('grant select on public.%I to life_reader', t);
  end loop;

  foreach t in array array['tags','taggables','source_items','places','records','measurements','entries',
    'reviews','review_scores','goals','trips','trip_legs','people','interactions','accounts','balances',
    'documents','obligations','media','links','review_queue','workflow_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_owner', t);
    execute format('create policy %I on public.%I for select to life_reader using (owner_id = (select auth.uid()))', t || '_reader', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.life_touch_updated_at()', t || '_touch', t);
    execute format('grant select on public.%I to life_reader', t);
  end loop;
end $$;

-- Ask runs model-written SQL through this function as life_reader, with RLS
-- still scoped to the caller's auth.uid().
create or replace function public.life_ask_query(q text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if q !~* '^\s*(select|with)\s' or q ~ ';\s*\S' then
    raise exception 'Only a single SELECT is allowed';
  end if;
  -- life_reader holds SELECT only, so the query cannot write.
  set local role life_reader;
  set local statement_timeout = '8s';
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) s limit 200) t', q) into result;
  return result;
end $$;
revoke all on function public.life_ask_query(text) from public, anon;
grant execute on function public.life_ask_query(text) to authenticated;

-- ===== Storage =====

insert into storage.buckets (id, name, public) values ('life-files', 'life-files', false)
on conflict (id) do nothing;

create policy life_files_owner on storage.objects for all to authenticated
  using (bucket_id = 'life-files' and owner = (select auth.uid()))
  with check (bucket_id = 'life-files' and owner = (select auth.uid()));

-- ===== Seeds =====

insert into public.areas (slug, name, sort_order, description) values
  ('body','Body',1,'Health, fitness, sleep, nutrition, habits'),
  ('mind','Mind',2,'Mood, learning, skills, principles, lessons'),
  ('people','People',3,'Family, friends, partner, mentors, community'),
  ('money','Money',4,'Net worth, income, debt, cash flow, insurance'),
  ('work','Work',5,'Companies, roles, wins, talks, books, reputation'),
  ('places','Places',6,'Travel, homes, events, firsts, bucket list'),
  ('time','Time',7,'Where the hours go, by area'),
  ('direction','Direction',8,'Vision, goals, commitments, reviews'),
  ('admin','Admin',9,'IDs, accounts, property, will, emergency info'),
  ('legacy','Legacy',10,'Photos, stories, family history, lifeline');

insert into public.sources (slug, name, method, cadence) values
  ('gmail','Gmail sweep','Apps Script webhook','hourly'),
  ('notion','Notion sync','Notion API','nightly'),
  ('apple_health','Apple Health','Health Auto Export webhook','daily'),
  ('tripit','TripIt feed','iCal feed','daily'),
  ('manual','Manual','Entered in /life','on demand');

insert into public.metrics (area_id, slug, name, unit, aggregation, direction, source_id)
select a.id, m.slug, m.name, m.unit, m.agg, m.dir, s.id
from (values
  ('body','weight_kg','Weight','kg','last','target','apple_health'),
  ('body','body_fat_pct','Body fat','%','last','lower_better','apple_health'),
  ('body','steps','Steps','steps','avg','higher_better','apple_health'),
  ('body','workouts','Workouts','count','sum','higher_better','apple_health'),
  ('body','active_kcal','Active energy','kcal','avg','higher_better','apple_health'),
  ('body','sleep_hours','Sleep','hours','avg','higher_better','apple_health'),
  ('body','resting_hr','Resting heart rate','bpm','avg','lower_better','apple_health'),
  ('body','hrv_ms','HRV','ms','avg','higher_better','apple_health'),
  ('mind','journal_entries','Journal entries','count','sum','higher_better','notion'),
  ('places','nights_away','Nights away','nights','sum','target','gmail'),
  ('places','trips','Trips','count','sum','target','gmail')
) as m(area, slug, name, unit, agg, dir, src)
join public.areas a on a.slug = m.area
join public.sources s on s.slug = m.src;

-- The signup trigger function must not be callable over the API.
revoke execute on function public.life_only_owner_signup() from public, anon, authenticated;
