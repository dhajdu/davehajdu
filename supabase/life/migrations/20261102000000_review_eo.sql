-- The monthly review is an EO forum update: MERPS words, struggle, success, and
-- four written updates (business, family, personal, community), each with
-- feelings, a headline and impact. Claude drafts it; the owner edits.
alter table public.reviews add column eo jsonb not null default '{}';
comment on column public.reviews.eo is
  'EO update: {merps:{mental,emotional,relationship,physical,spiritual}, struggle, success, updates:{business|family|personal|community:{feelings,headline,impact}}, drafted_at, edited_at}.';
