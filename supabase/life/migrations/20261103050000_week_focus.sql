-- The week's One Thing lives in the app too: horizon 'week' with the Monday
-- as its period. A One Thing set from the ladder needs no area.
alter table public.goals drop constraint goals_horizon_check;
alter table public.goals add constraint goals_horizon_check
  check (horizon in ('30d','60d','week','month','year','vision'));
alter table public.goals drop constraint goals_period_check;
alter table public.goals add constraint goals_period_check
  check (period ~ '^\d{4}-\d{2}(-\d{2})?$');
alter table public.goals alter column area_id drop not null;
comment on column public.goals.period is 'YYYY-MM for month goals, the Monday (YYYY-MM-DD) for week goals.';
