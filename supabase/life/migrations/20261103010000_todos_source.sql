-- Where a to-do came from, so the Notion sync never touches items added in the app.
alter table public.todos add column source text not null default 'app' check (source in ('app','notion'));
comment on column public.todos.source is 'app: written on /life/journal. notion: carried in from the journal''s DOING and dated DONE lists by the sync.';
