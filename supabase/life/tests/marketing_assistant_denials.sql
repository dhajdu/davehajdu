-- Proves what the marketing_assistant role cannot do. Runs inside one
-- transaction and rolls back, leaving nothing behind. Needs a brand
-- 'dave-hajdu' and a role allowed to call marketing_assistant_run:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/life/tests/marketing_assistant_denials.sql

begin;

create function pg_temp.run(sql text, args jsonb default '{}') returns jsonb language sql as
$$ select public.marketing_assistant_run(sql, args, 'dave-hajdu') $$;

-- Must raise: a refused privilege or a row security violation.
create function pg_temp.denied(what text, sql text, args jsonb default '{}') returns void language plpgsql as $$
begin
  begin
    perform pg_temp.run(sql, args);
  exception when insufficient_privilege or check_violation then
    reset role;
    raise notice 'ok   denied: %', what;
    return;
  end;
  raise exception 'FAILED, was allowed: %', what;
end $$;

-- Must run but touch or see nothing.
create function pg_temp.zero(what text, sql text, args jsonb default '{}') returns void language plpgsql as $$
declare n int;
begin
  n := jsonb_array_length(pg_temp.run(sql, args));
  reset role;
  if n <> 0 then raise exception 'FAILED, reached % rows: %', n, what; end if;
  raise notice 'ok   no rows: %', what;
end $$;

create function pg_temp.allowed(what text, sql text, args jsonb default '{}') returns void language plpgsql as $$
declare n int;
begin
  n := jsonb_array_length(pg_temp.run(sql, args));
  reset role;
  if n = 0 then raise exception 'FAILED, reached no rows: %', what; end if;
  raise notice 'ok   allowed: %', what;
end $$;

insert into public.brands (owner_id, slug, name) select owner_id, 'denial-other', 'Other' from public.brands where slug = 'dave-hajdu';
insert into public.posts (owner_id, brand_id, status, slug, title)
select b.owner_id, b.id, s.status, s.slug, s.slug
from public.brands b
join (values
  ('dave-hajdu', 'drafted', 'denial-draft'),
  ('dave-hajdu', 'approved', 'denial-approved'),
  ('denial-other', 'drafted', 'denial-other-draft')
) s(brand, status, slug) on s.brand = b.slug;
insert into public.posts (owner_id, brand_id, status, slug, title, published_at)
select owner_id, id, 'published', 'denial-live', 'denial-live', now() from public.brands where slug = 'dave-hajdu';

insert into public.entries (owner_id, kind, title, entry_date)
select owner_id, k, 'denial-entry', current_date from public.brands, unnest(array['journal', 'note']) k where slug = 'dave-hajdu';

-- What it is meant to do still works.
select pg_temp.allowed('read its own drafts', $q$select id from posts where slug = 'denial-draft'$q$);
select pg_temp.allowed('update its own draft', $q$update posts set title = 'changed' where slug = 'denial-draft' returning id$q$);
select pg_temp.allowed('create a draft', $q$insert into posts (brand_id, status, slug, title) values (marketing_assistant_brand(), 'drafted', 'denial-new', 'n') returning id$q$);

-- Publishing and approval.
select pg_temp.denied('move a draft to approved', $q$update posts set status = 'approved' where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('move a draft to published', $q$update posts set status = 'published' where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('create a post as approved', $q$insert into posts (brand_id, status, slug, title) values (marketing_assistant_brand(), 'approved', 'denial-a', 'a') returning id$q$);
select pg_temp.denied('create a post as published', $q$insert into posts (brand_id, status, slug, title) values (marketing_assistant_brand(), 'published', 'denial-p', 'p') returning id$q$);
select pg_temp.denied('set approved_version', $q$update posts set approved_version = 'x' where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('set published_at', $q$update posts set published_at = now() where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('set scheduled_for', $q$update posts set scheduled_for = now() where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('change the campaign', $q$update posts set campaign_id = null where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('change the owner', $q$update posts set owner_id = null where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('delete a draft', $q$delete from posts where slug = 'denial-draft' returning id$q$);
select pg_temp.zero('edit an approved post', $q$update posts set title = 'x' where slug = 'denial-approved' returning id$q$);
select pg_temp.zero('edit a live post', $q$update posts set title = 'x' where slug = 'denial-live' returning id$q$);

-- Other brands.
select pg_temp.zero('read another brand''s post', $q$select id from posts where slug = 'denial-other-draft'$q$);
select pg_temp.zero('update another brand''s post', $q$update posts set title = 'x' where slug = 'denial-other-draft' returning id$q$);
select pg_temp.zero('read another brand', $q$select id from brands where slug = 'denial-other'$q$);
select pg_temp.denied('create a post for another brand', $q$insert into posts (brand_id, status, slug, title) values (($1->>'brand')::uuid, 'drafted', 'denial-x', 'x') returning id$q$, jsonb_build_object('brand', (select id from public.brands where slug = 'denial-other')));

-- The rest of the cockpit and /life.
select pg_temp.denied('write brand profiles', $q$update brand_profiles set voice = 'x' returning brand_id$q$);
select pg_temp.denied('read campaigns', $q$select id from campaigns$q$);
select pg_temp.denied('forge a cron audit row', $q$insert into post_audit (post_id, actor, action) select id, 'cron', 'publish' from posts where slug = 'denial-draft' returning id$q$);
select pg_temp.denied('read todos', $q$select id from todos$q$);
select pg_temp.denied('read goals', $q$select id from goals$q$);
select pg_temp.denied('read measurements', $q$select id from measurements$q$);
select pg_temp.denied('read logins', $q$select id from logins$q$);
select pg_temp.denied('read addresses', $q$select id from addresses$q$);
select pg_temp.denied('read documents', $q$select id from documents$q$);
select pg_temp.allowed('read journal days', $q$select id from entries where kind = 'journal' and title = 'denial-entry'$q$);
select pg_temp.zero('read non-journal entries', $q$select id from entries where title = 'denial-entry' and kind <> 'journal'$q$);

rollback;
