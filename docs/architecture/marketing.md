# Marketing

How the blog and, later, email are run from inside davehajdu.com. Why: [ADR 0001](../adr/0001-marketing-on-8-edges.md). Phases and decisions: [the plan](../plans/2026-11-08-marketing-on-8-edges.md).

## Today

Since phase 1, the 14 posts live in `posts` in dave-life (imported from the old `src/lib/posts-data.ts`, now deleted). `/blog`, `/blog/[slug]`, the home page preview, `sitemap.ts` and `llms.txt` read them through `src/lib/blog/posts.ts` and are static pages refreshed hourly. Until the cockpit (phase 2), a post is changed by editing its row; it shows within an hour, no deploy.

Bodies are markdown in `posts.body_md`, parsed into blocks by `src/lib/blog/body.ts` (headings, quotes, list items, raw HTML tables, and `::figure` / `::gallery` / `::screens` / `::video` media lines).

## Target (phases 1 to 3; phase 1 shipped)

| Piece | Where |
|---|---|
| Tables | `brands`, `brand_profiles`, `posts` (status idea → drafted → approved → scheduled → published / skipped; `brand_id`, slug unique per brand), `post_pillars`, `post_images`, campaigns; public bucket `blog` |
| Database | dave-life, migrations in `supabase/life/migrations` |
| Reader | `src/lib/blog/posts.ts`: publishable key; row security lets anonymous readers see published posts, brands and pillars only (`20261108030000_blog_public_read.sql`). Feeds `/blog`, `/blog/[slug]`, OG images, sitemap and `llms.txt` |
| Publish gate | `src/lib/blog/publish.ts`: 600+ words, hero image, slug, title tag, meta description, 2+ internal `/blog/` links, the brand's banned words. Approval is bound to a hash of the exact version. Publishing revalidates the pages and fetches the live URL |
| Scheduling | Daily cron at `/api/cron/blog-publish` |
| Cockpit | `src/app/life/(app)/marketing/`: overview, calendar, campaigns, post editor, brands; a Marketing group in the /life sidebar |
| Assistant | `/api/marketing/mcp`, bearer `MARKETING_ASSISTANT_TOKEN` (one per brand), Postgres role `marketing_assistant`. It reads its brand's profile, posts and pillars; inserts and updates posts only while `idea` or `drafted`; has no approve or publish; sees no /life data except journal days for the optional `suggest_from_journal`. Same build as `/api/life/mcp` (see [life.md](./life.md)) |

## Later

Email (audiences, broadcasts, send cap and window, Resend, tracking, unsubscribe, UTM), recurring series and the weekly letter, AI production (writer, exhibits, hero images) and measurement (social import, recaps, pulse, digest). See the plan's phases 4 to 7.
