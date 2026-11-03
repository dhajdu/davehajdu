-- The line in the to-do list: items planned for a day sit above it, in
-- sort_order; everything else waits below. An open item planned for an
-- earlier day carries forward above the line until it is done or moved.
alter table public.todos add column planned_on date;
comment on column public.todos.planned_on is 'The day the item is meant to be finished (above the line in the journal); null means another day.';
