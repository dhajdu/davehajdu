-- Marketing phase 2: the cockpit at /life/marketing.
-- An approval is bound to the exact version of a post (a hash of its content
-- columns), so an edit after approval needs a new approval. post_audit records
-- who moved or changed a post and why.

alter table public.posts
  add column approved_version text,
  add column approved_at timestamptz;
comment on column public.posts.approved_version is 'Hash of the content columns that were approved (src/lib/blog/publish.ts). Publishing refuses any other version.';

create table public.post_audit (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  post_id uuid not null references public.posts(id) on delete cascade,
  actor text not null check (actor in ('owner','assistant','cron')),
  action text not null,
  reason text,
  version text,
  created_at timestamptz not null default now()
);
comment on table public.post_audit is 'Every approval, schedule, publish, unpublish and assistant edit of a post.';
create index post_audit_post on public.post_audit (post_id, created_at desc);

alter table public.post_audit enable row level security;
create policy post_audit_owner on public.post_audit for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
