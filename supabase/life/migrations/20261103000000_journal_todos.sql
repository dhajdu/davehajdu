-- The journal, written in the app: structured day fields on entries, and
-- to-dos as rows that carry forward until done.
alter table public.entries add column fields jsonb;
comment on column public.entries.fields is 'Set for days written in the app: {one_thing, gratitude: [..], nhb}. body_md is rendered from them so search, Ask and the ladder read one shape. Null for Notion-synced days.';

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  parent_id uuid references public.todos(id) on delete cascade,
  title text not null,
  added_on date not null,
  done_on date,
  dropped_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.todos is 'The journal to-do list. An item is open from added_on until done_on or dropped_on; the journal page shows what was open on a day and what got done that day.';
comment on column public.todos.parent_id is 'One level of nesting, for sub-items.';
comment on column public.todos.added_on is 'The journal day the item was written.';
comment on column public.todos.done_on is 'The journal day it got done.';
comment on column public.todos.dropped_on is 'The journal day it was dropped without being done.';
create index todos_open on public.todos (owner_id, done_on, dropped_on);

alter table public.todos enable row level security;
create policy todos_owner on public.todos for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy todos_reader on public.todos for select to life_reader using (owner_id = (select auth.uid()));
create trigger todos_touch before update on public.todos for each row execute function public.life_touch_updated_at();
grant select on public.todos to life_reader;
