-- Month goals live in the app: horizon 'month' with a period, and one of them
-- can be the month's One Thing (focus).
alter table public.goals drop constraint goals_horizon_check;
alter table public.goals add constraint goals_horizon_check
  check (horizon in ('30d','60d','month','year','vision'));
alter table public.goals add column period text check (period ~ '^\d{4}-\d{2}$');
alter table public.goals add column focus boolean not null default false;
comment on column public.goals.period is 'YYYY-MM for month goals.';
comment on column public.goals.focus is 'True for the month''s One Thing (one per period).';
create index goals_period on public.goals (owner_id, period);
