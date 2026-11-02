-- The month-end review in Dave's own format: a headline, two grades with
-- health first, and three written sections. Separate from `reviews`, which
-- holds the EO forum updates' scores.
create table public.month_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  headline text,
  summary text,
  grade_health text,
  grade_business text,
  health_md text not null default '',
  business_md text not null default '',
  moves_md text not null default '',
  numbers text[] not null default '{}',
  closing text,
  status text not null default 'draft' check (status in ('draft','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, period)
);
comment on table public.month_reviews is 'Month-end review, one per month, in the owner''s format: health graded first, then business, then next month''s moves.';
comment on column public.month_reviews.period is 'YYYY-MM.';
comment on column public.month_reviews.headline is 'One line that names the month, e.g. "September, honestly."';
comment on column public.month_reviews.summary is 'Two sentences under the headline.';
comment on column public.month_reviews.grade_health is 'Letter grade for health, e.g. D+.';
comment on column public.month_reviews.grade_business is 'Letter grade for business, e.g. B+.';
comment on column public.month_reviews.health_md is 'Health section, markdown: what was set, what was logged, the honest read.';
comment on column public.month_reviews.business_md is 'Business section, markdown: what got done, what was missed.';
comment on column public.month_reviews.moves_md is 'Next month''s moves, markdown list, health first.';
comment on column public.month_reviews.numbers is 'Next month''s targets as short chips, e.g. "15 workouts".';
comment on column public.month_reviews.closing is 'The last line.';

alter table public.month_reviews enable row level security;
create policy month_reviews_owner on public.month_reviews for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy month_reviews_reader on public.month_reviews for select to life_reader using (owner_id = (select auth.uid()));
create trigger month_reviews_touch before update on public.month_reviews for each row execute function public.life_touch_updated_at();
grant select on public.month_reviews to life_reader;
