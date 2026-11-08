-- Blood sugar from a home meter, logged in the journal next to weight. Kept
-- apart from the lab's glucose_fasting so daily readings stay out of the panels.
insert into public.metrics (area_id, slug, name, unit, aggregation, direction, source_id)
select a.id, 'blood_sugar_mmol', 'Blood sugar', 'mmol/L', 'avg', 'target', s.id
from public.areas a, public.sources s
where a.slug = 'body' and s.slug = 'manual'
on conflict (slug) do nothing;
