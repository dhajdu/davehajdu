-- Marketing phase 3: the assistant (/api/marketing/mcp) reaches the database
-- only as marketing_assistant, scoped to one brand per token. Postgres, not the
-- endpoint code, decides what it can touch:
--   read          its brand's row, profile, pillars and posts; journal days
--   add/update    its brand's posts, only while status is idea or drafted
--   add           audit rows and image history for its brand's drafts
-- It has no column grant on approval, schedule, publish date, campaign or
-- owner, no delete, and nothing else in /life.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'marketing_assistant') then
    create role marketing_assistant nologin noinherit;
  end if;
end $$;
grant marketing_assistant to service_role;
grant usage on schema public to marketing_assistant;

create or replace function public.marketing_assistant_brand() returns uuid
language sql stable as $$ select nullif(current_setting('app.marketing_brand', true), '')::uuid $$;
grant execute on function public.marketing_assistant_brand() to marketing_assistant;

grant select on public.brands, public.brand_profiles, public.post_pillars, public.posts, public.entries, public.post_images, public.post_audit to marketing_assistant;
grant insert (brand_id, pillar_id, status, slug, title, title_tag, meta_description, excerpt, primary_keyword, body_md, tags, read_minutes, hero_image_url, og_image_url) on public.posts to marketing_assistant;
grant update (pillar_id, status, title, title_tag, meta_description, excerpt, primary_keyword, body_md, tags, read_minutes, hero_image_url, og_image_url) on public.posts to marketing_assistant;
grant insert (post_id, url, storage_path, alt, prompt, is_hero) on public.post_images to marketing_assistant;
grant insert (post_id, actor, action, reason, version) on public.post_audit to marketing_assistant;

create policy brands_marketing on public.brands for select to marketing_assistant
  using (id = public.marketing_assistant_brand());
create policy brand_profiles_marketing on public.brand_profiles for select to marketing_assistant
  using (brand_id = public.marketing_assistant_brand());
create policy post_pillars_marketing on public.post_pillars for select to marketing_assistant
  using (brand_id = public.marketing_assistant_brand());
create policy posts_marketing_read on public.posts for select to marketing_assistant
  using (brand_id = public.marketing_assistant_brand());
create policy posts_marketing_insert on public.posts for insert to marketing_assistant
  with check (brand_id = public.marketing_assistant_brand() and status in ('idea','drafted') and owner_id = (select auth.uid()));
create policy posts_marketing_update on public.posts for update to marketing_assistant
  using (brand_id = public.marketing_assistant_brand() and status in ('idea','drafted'))
  with check (brand_id = public.marketing_assistant_brand() and status in ('idea','drafted'));
create policy entries_marketing on public.entries for select to marketing_assistant
  using (owner_id = (select auth.uid()) and kind = 'journal');
create policy post_images_marketing_read on public.post_images for select to marketing_assistant
  using (post_id in (select id from public.posts where brand_id = public.marketing_assistant_brand()));
create policy post_images_marketing_insert on public.post_images for insert to marketing_assistant
  with check (owner_id = (select auth.uid()) and post_id in (select id from public.posts where brand_id = public.marketing_assistant_brand() and status in ('idea','drafted')));
create policy post_audit_marketing_read on public.post_audit for select to marketing_assistant
  using (post_id in (select id from public.posts where brand_id = public.marketing_assistant_brand()));
create policy post_audit_marketing_insert on public.post_audit for insert to marketing_assistant
  with check (actor = 'assistant' and owner_id = (select auth.uid()) and post_id in (select id from public.posts where brand_id = public.marketing_assistant_brand()));

-- The MCP endpoint (service role) runs each fixed tool query through here as
-- marketing_assistant, with auth.uid() pinned to the brand's owner and the
-- brand pinned for the policies above. $1 is a jsonb of the tool's arguments.
-- With a _audit key, each returned row's id is written to post_audit.
create or replace function public.marketing_assistant_run(q text, args jsonb, brand text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  b public.brands%rowtype;
  result jsonb;
begin
  select * into b from public.brands where slug = brand;
  if b.id is null then
    raise exception 'Unknown brand';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b.owner_id, 'role', 'marketing_assistant')::text, true);
  perform set_config('request.jwt.claim.sub', b.owner_id::text, true);
  perform set_config('app.marketing_brand', b.id::text, true);
  set local role marketing_assistant;
  set local statement_timeout = '8s';
  execute format('with t as (%s) select coalesce(jsonb_agg(t), ''[]''::jsonb) from t', q) into result using args;
  -- A write tool passes _audit: the audit row lands in this transaction or not at all.
  if args ? '_audit' then
    insert into public.post_audit (post_id, actor, action, reason)
    select (e->>'id')::uuid, 'assistant', args->>'_audit', args->>'reason' from jsonb_array_elements(result) e;
  end if;
  return result;
end $$;
revoke all on function public.marketing_assistant_run(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.marketing_assistant_run(text, jsonb, text) to service_role;
