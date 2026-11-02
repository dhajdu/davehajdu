-- Every analyte of every lab panel, as data: numeric or text result, the
-- lab's reference range and its flag. The nine tracked markers also go to
-- `measurements` (through `metrics` on the `lab` source) for trends and goals.
create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  record_id uuid references public.records(id),
  document_id uuid references public.documents(id),
  tested_on date not null,
  lab text,
  category text not null,
  panel text,
  analyte text not null,
  value numeric,
  value_text text,
  unit text,
  ref_low numeric,
  ref_high numeric,
  ref_text text,
  flag text not null default 'normal' check (flag in ('normal','low','high','abnormal')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, tested_on, analyte)
);
comment on table public.lab_results is 'One row per analyte per lab panel (blood, urine). The full report as data; the PDF is the linked document.';
comment on column public.lab_results.record_id is 'The Body record (kind lab) for this panel.';
comment on column public.lab_results.document_id is 'The report PDF in the private bucket.';
comment on column public.lab_results.tested_on is 'Sample collection date.';
comment on column public.lab_results.lab is 'Laboratory name, e.g. Diag.';
comment on column public.lab_results.category is 'Report section: hematology, hba1c, biochemistry, lipids, liver, inflammation, immunology, hormones, vitamins, urine.';
comment on column public.lab_results.panel is 'Sub-panel on the report, e.g. Complete Blood Count, Lipid Basic Panel.';
comment on column public.lab_results.analyte is 'Marker name as printed, e.g. LDL Cholesterol, Hemoglobin.';
comment on column public.lab_results.value is 'Numeric result in `unit`; null for text results.';
comment on column public.lab_results.value_text is 'Text result such as Negative, Positive, Nonreactive, 2+.';
comment on column public.lab_results.ref_low is 'Lower bound of the reference range.';
comment on column public.lab_results.ref_high is 'Upper bound of the reference range.';
comment on column public.lab_results.ref_text is 'Reference range as printed, including bands such as prediabetes 5.7 to 6.4.';
comment on column public.lab_results.flag is 'normal, low, high, or abnormal (for text results outside the expected).';
comment on column public.lab_results.sort_order is 'Order on the printed report.';

alter table public.lab_results enable row level security;
create policy lab_results_owner on public.lab_results for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy lab_results_reader on public.lab_results for select to life_reader using (owner_id = (select auth.uid()));
create trigger lab_results_touch before update on public.lab_results for each row execute function public.life_touch_updated_at();
grant select on public.lab_results to life_reader;
