-- The first campaign, run by hand before the cockpit existed. Safe to re-run.

insert into public.campaigns (owner_id, brand_id, pillar_id, name, goal, starts_on, ends_on, status, notes)
select b.owner_id, b.id, p.id,
  'The Factory Is the Product',
  'Own the idea among founders and turn it into keynote conversations',
  date '2026-11-12', date '2026-11-25', 'active',
  E'Essay live Nov 9.\n\nThu Nov 12: LinkedIn 1, the rent check\nNov 12-13: personal note to 20 founders\nFri Nov 13: Facebook story post\nMon Nov 16: LinkedIn 2, Colossus and Liberty ships\nWed Nov 18: 35-second vertical film\nThu Nov 19: LinkedIn 3, tokens and customs\nMon Nov 23: LinkedIn 4, the 90-day clause\nWed Nov 25: LinkedIn 5 and EO forum prompt\nAfter Nov 25: add the keynote topic\n\nCopy, napkins and fact sheet: https://claude.ai/artifact/Rd8jbYNtzgc5tG1L7iXiFd'
from public.brands b
left join public.post_pillars p on p.brand_id = b.id and p.name = 'AI In Business'
where b.slug = 'dave-hajdu'
  and not exists (select 1 from public.campaigns c where c.brand_id = b.id and c.name = 'The Factory Is the Product');

update public.posts po
set campaign_id = c.id
from public.campaigns c, public.brands b
where b.slug = 'dave-hajdu'
  and c.brand_id = b.id and c.name = 'The Factory Is the Product'
  and po.brand_id = b.id and po.slug = 'the-factory-is-the-product';
