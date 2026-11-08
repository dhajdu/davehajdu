-- The personal assistant (Grok over MCP, /api/life/mcp) reaches the database
-- only as life_assistant. Postgres, not the endpoint code, decides what it
-- can touch:
--   read   entries (journal days only), goals, trips, trip_legs, places
--          (not home), metrics
--   read + add/update   todos; measurements for weight and blood sugar only
-- Everything else (health, labs, people, money, documents, logins,
-- addresses, integrations, raw source items) is never granted.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'life_assistant') then
    create role life_assistant nologin noinherit;
  end if;
end $$;
grant life_assistant to service_role;
grant usage on schema public to life_assistant;

grant select on public.entries, public.goals, public.trips, public.trip_legs, public.places, public.metrics to life_assistant;
grant select, insert, update on public.todos, public.measurements to life_assistant;

create policy entries_assistant on public.entries for select to life_assistant
  using (owner_id = (select auth.uid()) and kind = 'journal');
create policy goals_assistant on public.goals for select to life_assistant
  using (owner_id = (select auth.uid()));
create policy trips_assistant on public.trips for select to life_assistant
  using (owner_id = (select auth.uid()));
create policy trip_legs_assistant on public.trip_legs for select to life_assistant
  using (owner_id = (select auth.uid()));
create policy places_assistant on public.places for select to life_assistant
  using (owner_id = (select auth.uid()) and kind <> 'home');
create policy metrics_assistant on public.metrics for select to life_assistant
  using (true);
create policy todos_assistant on public.todos for all to life_assistant
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy measurements_assistant on public.measurements for all to life_assistant
  using (owner_id = (select auth.uid()) and metric_id in (select id from public.metrics where slug in ('weight_kg', 'blood_sugar_mgdl')))
  with check (owner_id = (select auth.uid()) and metric_id in (select id from public.metrics where slug in ('weight_kg', 'blood_sugar_mgdl')));

-- The MCP endpoint (service role) runs each fixed tool query through here:
-- as life_assistant, with auth.uid() pinned to the owner, so RLS above
-- applies. $1 is a jsonb of the tool's arguments. Returns the rows as jsonb.
create or replace function public.life_assistant_run(q text, args jsonb, owner uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare result jsonb;
begin
  if owner is null then
    raise exception 'No owner';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner, 'role', 'life_assistant')::text, true);
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role life_assistant;
  set local statement_timeout = '8s';
  execute format('with t as (%s) select coalesce(jsonb_agg(t), ''[]''::jsonb) from t', q) into result using args;
  return result;
end $$;
revoke all on function public.life_assistant_run(text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.life_assistant_run(text, jsonb, uuid) to service_role;
