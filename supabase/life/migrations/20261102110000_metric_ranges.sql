-- Lab results carry a reference range. Stored on the metric so every reading
-- can be read as in or out of range without a lookup table.
alter table public.metrics
  add column ref_low numeric,
  add column ref_high numeric,
  add column ref_note text;
comment on column public.metrics.ref_low is 'Lower bound of the healthy range, if any.';
comment on column public.metrics.ref_high is 'Upper bound of the healthy range, if any.';
comment on column public.metrics.ref_note is 'How the lab bands this marker, in words (prediabetes 5.7 to 6.4, and so on).';
