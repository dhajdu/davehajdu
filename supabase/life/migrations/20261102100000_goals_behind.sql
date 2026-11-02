-- Vision and year goals report progress, not just the outcome: 'behind' sits
-- between open (on track) and hit (achieved).
alter table public.goals drop constraint goals_status_check;
alter table public.goals add constraint goals_status_check
  check (status in ('open','hit','missed','dropped','behind'));
comment on column public.goals.status is 'open (on track), behind, hit (achieved), missed, dropped. The review cron sets hit/missed on metric goals; behind is set by the owner on vision and year goals.';
