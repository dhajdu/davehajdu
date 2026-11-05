-- The home meter (Nipro Premier) reads in mg/dL, so blood sugar is kept in
-- mg/dL. Any reading already saved in mmol/L is converted (1 mmol/L = 18.016 mg/dL).
update public.measurements ms
set value = round(ms.value * 18.016)
from public.metrics m
where m.id = ms.metric_id and m.slug = 'blood_sugar_mmol';

update public.metrics set slug = 'blood_sugar_mgdl', unit = 'mg/dL' where slug = 'blood_sugar_mmol';
