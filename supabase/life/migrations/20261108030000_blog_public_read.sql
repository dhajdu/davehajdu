-- The public blog reads with the publishable key, so the secret key never
-- serves a public page. Anonymous visitors can read published posts, and the
-- brand and pillar names shown with them. Nothing else: drafts, campaigns,
-- images and brand profiles stay owner-only.

create policy posts_public_read on public.posts for select to anon
  using (status = 'published');
create policy brands_public_read on public.brands for select to anon
  using (true);
create policy post_pillars_public_read on public.post_pillars for select to anon
  using (true);
