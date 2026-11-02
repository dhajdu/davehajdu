-- Trips are business (the default), EO, or a holiday (stored as 'personal').
alter table public.trips drop constraint trips_purpose_check;
alter table public.trips add constraint trips_purpose_check check (purpose in ('business','eo','personal','unknown'));
comment on column public.trips.purpose is 'business (default), eo (forum, retreats, chapter work), personal (holiday), unknown (not sorted yet).';
