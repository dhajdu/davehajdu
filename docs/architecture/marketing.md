# Marketing

How the blog and, later, email are run from inside davehajdu.com. Why: [ADR 0001](../adr/0001-marketing-on-8-edges.md). Phases and decisions: [the plan](../plans/2026-11-08-marketing-on-8-edges.md).

## Today

Posts live in `posts` in dave-life. `/blog`, `/blog/[slug]`, the home page preview, `sitemap.ts` and `llms.txt` read them through `src/lib/blog/posts.ts` and are static pages refreshed hourly, or on demand when a post is published or unpublished. No post needs a deploy.

Bodies are markdown in `posts.body_md`, parsed into blocks by `src/lib/blog/body.ts` (headings, quotes, list items, raw HTML tables, and `::figure` / `::gallery` / `::screens` / `::video` media lines). Inline links are HTML (`<a href="/blog/other-post">`).

| Piece | Where |
|---|---|
| Tables | `brands`, `brand_profiles`, `posts` (status idea → drafted → approved → scheduled → published / skipped; `brand_id`, slug unique per brand; `approved_version`, `approved_at`), `post_pillars`, `post_images`, `post_audit`, `campaigns`; public bucket `blog` |
| Database | dave-life, migrations in `supabase/life/migrations` |
| Reader | `src/lib/blog/posts.ts`: publishable key; row security lets anonymous readers see published posts, brands and pillars only (`20261108030000_blog_public_read.sql`). Feeds `/blog`, `/blog/[slug]`, OG images, sitemap and `llms.txt` |
| Publish gate | `src/lib/blog/publish.ts`: 600+ words, hero image, valid unused slug, title tag, meta description, 2+ internal `/blog/` links, the brand's banned words. The editor, the cron and the assistant's `run_validation_checks` all use it |
| Approval | Bound to a hash of the exact version (`postVersion`: slug, title, title tag, meta description, excerpt, body, FAQs, hero and share image). An edit to an approved or scheduled post clears the approval. Publishing refuses any other version |
| Live-edit lock | A published post's content cannot change in place. Pillar, campaign, keyword, tags and featured can. To change the words: Unpublish to edit, then approve and publish again; the original publish date is kept |
| Publishing | Revalidates `/blog/<slug>`, `/blog`, `/`, `/sitemap.xml` and `/llms.txt`, then fetches the live URL and reports whether it responded |
| Scheduling | Daily cron at `/api/cron/blog-publish`, 01:00 UTC (08:00 Vietnam). A date picked in the editor goes live that morning. A post that fails the gate stays scheduled and the run records the error in `workflow_runs` |
| Cockpit | `src/app/life/(app)/marketing/`: overview, calendar (board and month), campaigns, post editor, brand. A Marketing group in the /life sidebar. Hero images upload to the `blog` bucket through a server action (8 MB limit in `next.config.ts`) |
| Assistant | `/api/marketing/mcp`, see below |

## Marketing assistant

`/api/marketing/mcp` is a stateless MCP server, modelled on `/api/life/mcp`. Auth is `Authorization: Bearer <MARKETING_ASSISTANT_TOKEN>` (one token per brand; today only `dave-hajdu`). Every call is logged in `workflow_runs` as `marketing:<tool>`.

Tools: `get_brand_profile`, `list_posts`, `get_post`, `list_pillars`, `create_draft`, `update_draft` (a reason is required), `run_validation_checks`, `generate_hero_image`, `suggest_from_journal`. There is no approve, schedule or publish tool.

Each query runs through `marketing_assistant_run` as the `marketing_assistant` role, with the brand pinned for row security (`20261109010000_marketing_assistant.sql`). The role reads its brand's profile, pillars and posts, and journal days. It inserts and updates posts only while `idea` or `drafted`. It has no column grant on approval, schedule, publish date, campaign or owner, and no delete. A write that passes `_audit` lands its `post_audit` row in the same transaction.

`supabase/life/tests/marketing_assistant_denials.sql` proves those limits and rolls back: run it with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "set role service_role" -f <file>`.

Environment: `MARKETING_ASSISTANT_TOKEN` (32+ characters), `GEMINI_API_KEY` (for `generate_hero_image`). The cron uses the existing `CRON_SECRET`.

Campaigns hold blog posts. Social posts have no table yet, so a campaign's social calendar lives in its notes.

## Later

Email (audiences, broadcasts, send cap and window, Resend, tracking, unsubscribe, UTM), recurring series and the weekly letter, AI production (writer, exhibits, hero images) and measurement (social import, recaps, pulse, digest). See the plan's phases 4 to 7.
