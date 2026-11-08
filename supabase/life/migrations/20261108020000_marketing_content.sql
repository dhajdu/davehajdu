-- Marketing phase 1: the content core (plan: docs/plans/2026-11-08-marketing-on-8-edges.md).
-- Ported from edge8-web's company_os.marketing_* tables. Every post, campaign
-- and pillar belongs to a brand; the brand profile sets how content is written.
-- Owner-only, like the rest of dave-life. The public blog reads published posts
-- server-side through src/lib/blog (published rows only). No life_reader or
-- life_assistant grants.

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  slug text not null unique,
  name text not null,
  site_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.brands is 'Who the content is published as. One to start (Dave Hajdu).';

create table public.brand_profiles (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id),
  voice text,
  audience text,
  rules text,
  banned_words text[] not null default '{}',
  updated_at timestamptz not null default now()
);
comment on table public.brand_profiles is 'How the brand writes: voice, audience, house rules. Read by writers and assistants before drafting.';
comment on column public.brand_profiles.banned_words is 'Words and phrases the publish gate rejects.';

create table public.post_pillars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  brand_id uuid not null references public.brands(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort int not null default 0,
  unique (brand_id, slug)
);
comment on table public.post_pillars is 'Content themes. name is shown as the post category.';

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  goal text,
  pillar_id uuid references public.post_pillars(id) on delete set null,
  starts_on date,
  ends_on date,
  status text not null default 'idea' check (status in ('idea','active','done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.campaigns is 'An idea with a goal and dates that groups posts (and, later, emails and social).';

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  brand_id uuid not null references public.brands(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  pillar_id uuid references public.post_pillars(id) on delete set null,
  status text not null default 'idea' check (status in ('idea','drafted','approved','scheduled','published','skipped')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  title_tag text,
  meta_description text,
  excerpt text,
  primary_keyword text,
  body_md text not null default '',
  faqs jsonb not null default '[]',
  tags text[] not null default '{}',
  read_minutes int check (read_minutes > 0),
  hero_image_url text,
  og_image_url text,
  featured boolean not null default false,
  day_number int,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug),
  check (status <> 'published' or published_at is not null),
  check (status <> 'scheduled' or scheduled_for is not null)
);
comment on table public.posts is 'Blog posts, from idea to published. /blog/<slug> serves rows with status published.';
comment on column public.posts.body_md is 'Markdown body. Inline HTML allowed; media lines are ::figure, ::gallery, ::screens, ::video (see src/lib/blog/body.ts).';
comment on column public.posts.faqs is 'Array of {q, a}; rendered as FAQPage JSON-LD.';
comment on column public.posts.title_tag is 'SEO <title>, when it differs from title (60 characters or fewer).';
comment on column public.posts.day_number is 'Day number for the 88-day series posts.';
create index posts_published on public.posts (brand_id, published_at desc) where status = 'published';

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  prompt text,
  is_hero boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.post_images is 'Image history per post (uploaded or generated). The hero in use is posts.hero_image_url.';
create index post_images_post on public.post_images (post_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['brands','brand_profiles','post_pillars','campaigns','posts','post_images'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_owner', t);
  end loop;
end $$;

create trigger brands_touch before update on public.brands for each row execute function public.life_touch_updated_at();
create trigger brand_profiles_touch before update on public.brand_profiles for each row execute function public.life_touch_updated_at();
create trigger campaigns_touch before update on public.campaigns for each row execute function public.life_touch_updated_at();
create trigger posts_touch before update on public.posts for each row execute function public.life_touch_updated_at();

-- Public bucket for blog images; only the owner writes.
insert into storage.buckets (id, name, public) values ('blog', 'blog', true)
  on conflict (id) do nothing;
create policy blog_owner_write on storage.objects for all to authenticated
  using (bucket_id = 'blog' and owner = (select auth.uid()))
  with check (bucket_id = 'blog' and owner = (select auth.uid()));
