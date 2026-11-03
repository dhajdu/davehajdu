-- Every goal is on one of two tracks, health or business, so each rung of the
-- ladder carries one of each. Existing rows take the track from their area.
alter table public.goals add column track text check (track in ('health','business'));
update public.goals g set track = case when a.slug in ('body','mind') then 'health' else 'business' end
  from public.areas a where a.id = g.area_id and g.track is null;
update public.goals set track = 'business' where track is null;
alter table public.goals alter column track set not null;
alter table public.goals alter column track set default 'business';
comment on column public.goals.track is 'health or business: the two tracks of the One Thing ladder.';
