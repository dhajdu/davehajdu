# Plan: marketing inside davehajdu.com

**Date:** 2026-11-08 · **Owner:** Dave Hajdu · **Status:** agreed for phases 0 to 3; email decisions (5, 6) wait for phase 4

davehajdu.com is Dave's own site and database, separate from Edge8. This plan rebuilds the 8 Edges marketing features (from edge8-web) inside this repo:
- a content calendar
- an SEO publish gate
- an approve-and-schedule flow
- hero images
- a publish editor

A marketing assistant then keeps the blog current over its own MCP, with database-enforced limits like the /life assistant's.

---

## 1. Define the problem

- **Who feels it:** Dave, the only person who can publish on davehajdu.com.
- **What it costs:**
  - Every post is a hand edit to `src/lib/posts-data.ts`: 938 lines of TypeScript covering 15 posts.
  - Every post needs a code deploy to go live.
  - No assistant can safely draft or refresh posts, so the blog falls behind.
  - Edge8 has already solved this (calendar, SEO checks, approval, scheduling, AI images, a publish editor), but davehajdu.com can't use it.
  - The docs are stale: they're from 2026-04-29, don't mention /life, and Epic 4 still calls a CMS "a future call".
- **Why now:**
  - The /life MCP proved the pattern.
  - Bringing marketing into the same app and database gives Dave one personal operating system: life plus marketing.

## 2. Discover the data

**Source to port from (edge8-web, read 2026-11-08):**

| Edge8 piece | Path | Port as |
|---|---|---|
| `company_os.marketing_content` (status idea → drafted → approved → scheduled → published; `slug`, `title_tag`, `meta_description`, `excerpt`, `primary_keyword`, `category`, `read_time`, `published_at`, `seo_md`, `copy_md`, `image_url`, `pillar_id`) | `supabase/migrations/20260822090000_marketing_calendar.sql` and follow-ons; `docs/db/data-dictionary.md:526` | `public.posts`, with `brand_id` (slug unique per brand) |
| `marketing_pillars` | same | `public.post_pillars` (topics: AI in business, high-performance culture, ...) |
| `marketing_asset_images` and the `marketing` bucket | `20260823160000_marketing_images.sql`, `lib/ai/brand-image.ts` | `public.post_images` and a public `blog` bucket |
| `brands` and `brand_profiles`: voice, rules, auto-publish | edge8-web | `public.brands` and `public.brand_profiles`. They set how content is written. One brand to start (Dave Hajdu), with room for a second. |
| Reader | `entities/campaigns/lib/blog.ts`, `entities/site/lib/posts.ts`, `kernel/config/post-html-schema` | `src/lib/blog/` |
| Publish gate | `entities/campaigns/lib/blog-publish.ts` `publishBlogAsset()`, `seo.ts`, `writer/publish-approval.ts` | `src/lib/blog/publish.ts` |
| Publish editor tools | `entities/campaigns/lib/publish-editor/tools.ts` | The MCP tools |
| Scheduling cron | `entities/campaigns/crons/blog-publish.ts` | `/api/cron/blog-publish` |
| Writer pipeline, email broadcasts | `entities/campaigns/lib/writer/`, `marketing-email*.ts` | Later phases |

**Every marketing function in edge8-web** (`entities/campaigns`, read 2026-11-08), and what happens to it here:

| Function | Edge8 source | Here |
|---|---|---|
| **Content calendar** (kanban and month; idea → drafted → approved → scheduled → published / skipped) across blog, email, LinkedIn, Facebook, X | `routes/.../marketing/calendar`, `lib/marketing-calendar*.ts`, `calendar-drafting.ts` | Port |
| **Campaigns**: an idea with a goal, dates, pillar and SEO plan that spawns assets on every channel; a campaign ledger | `marketing/campaigns`, `lib/marketing-campaigns*.ts`, `campaign-plan-shared.ts`, `campaign-ledger*.ts` | Port |
| **Pillars**: content themes | `marketing_pillars` | Port |
| **Blog publish gate, version-bound approval, live-edit lock, scheduled publish** | `lib/blog-publish.ts`, `blog-version.ts`, `blog-live-edit.ts`, `seo.ts`, `crons/blog-publish.ts` | Port; checks as decided (decision 2) |
| **Publish editor**: an AI agent that checks and fixes a post | `lib/publish-editor/` | Port, as MCP tools |
| **Writer pipeline**: draft → edit → SEO → exhibits → hero → links → validate → channels | `lib/writer/`, `crons/agent-driver.ts`, `writer-schedule.ts` | Port |
| **Exhibits**: charts in posts, generated as SVG and saved as PNG | `lib/exhibits.ts` | Port with the writer |
| **Hero images**: Gemini, with an image history per post | `lib/marketing-images.ts`, `lib/ai/brand-image.ts`, `marketing_asset_images` | Port |
| **Broadcasts**: one email send; blocks, names, approval, lifecycle, report | `marketing/broadcasts`, `lib/broadcasts.ts`, `broadcast-*.ts`, `marketing-email*.ts`, `crons/email-campaign-send.ts` | Port |
| **Audiences**: saved rules worked out from the contact data each time a send is built | `marketing/audiences`, `lib/audiences.ts`, `audience-rules.ts`, `recipients.ts` | Port; rules re-based on Dave's contacts (decision 5) |
| **Recurring series**: weekly issues that open as drafts on a schedule and send after approval | `marketing/recurring`, `lib/series*.ts`, `crons/email-series-draft.ts` | Port |
| **Send rules**: one marketing email per person per day; sends land in each person's morning, in their time zone | `lib/send-cap.ts`, `send-window*.ts`, `send-decision.ts` | Port |
| **Delivery and tracking**: Resend webhook, opens and clicks, delivery history, unsubscribe | `lib/email-tracking.ts`, `delivery-history.ts`, `site/api/unsubscribe` | Port |
| **UTM tagging** of email and social links | `lib/marketing-email-utm.ts`, `utm.ts` | Port |
| **Weekly letter**: an AI-drafted weekly email | `lib/letter/`, `crons/letter-weekly.ts` | Port; drafted from the journal and published posts |
| **Social**: LinkedIn and Facebook analytics imported from exports, plus links to posts once live | `marketing/SocialSection.tsx`, `lib/social-import/`, `social-metrics.ts` | Port |
| **Recaps, weekly pulse, digest**: monthly content recommendations, plus weekly and daily summaries | `marketing/recaps`, `lib/marketing-recaps.ts`, `crons/marketing-recap.ts`, `marketing-weekly-pulse.ts`, `marketing-digest.ts` | Port; delivered to Lark or the /life Inbox |
| **Content engine overview**: a cockpit of counts across the funnel | `marketing/page.tsx`, `lib/marketing-engine.ts` | Port |
| **Books**: manuscripts as source for content | `marketing/books`, `lib/books.ts` | Adapt to Dave's two books |
| **Brands, brand profiles, auto-publish** | `marketing/brands`, `brand-profiles.ts`, `brand-sites.ts` | Port. Every asset, campaign and pillar belongs to a brand, and the profile drives the writing (voice, rules, banned words). One brand now; a second brand adds a profile and, if it has its own site, a `brand_sites` entry. |
| **Personal sections** (per-recipient learner progress), **revenue board sync** | `personal-sections.ts`, `learner-progress.ts`, `crons/revenue-content-sync.ts` | Skip: tied to the AIO platform and Edge8 revenue |

**Database (decided 2026-11-08):** dave-life. It already holds the journal, so drafts can grow out of journal days, and it has the owner login and the role-per-assistant pattern. The public blog reads published posts from it with the server-side key, only through a reader limited to published rows.

**What exists here:**
- 15 posts with block content in `posts-data.ts`, plus images in `public/images/`.
- `/blog` and `/blog/[slug]` pages, `sitemap.ts`, `llms.txt`.

**What's new:**
- Migrations for `brands`, `brand_profiles`, `posts`, `post_pillars`, `post_images` and the `blog` bucket, plus a seeded "Dave Hajdu" brand and profile written from his existing posts.
- A `marketing_assistant` role.
- A one-time import of the 15 posts (blocks → markdown).
- Env vars `MARKETING_ASSISTANT_TOKEN`, plus `GEMINI_API_KEY` for images.

## 3. Design the workflow

**Publishing a post:**
1. An idea or draft is added in **/life → Marketing**, a new sidebar group with Overview, Calendar, Campaigns, Posts and Brands. A brand picker appears once there's more than one brand. It can come from Dave, or from the assistant over MCP.
2. The post editor shows copy, SEO fields, a hero image and a live checklist from the publish gate.
3. Dave clicks **Approve**, which is tied to a hash of that exact version (Edge8's rule). He then publishes now or picks a date.
4. The gate runs on publish:
   - word count, hero image, slug, title tag, meta description
   - internal links to other `/blog/` posts
   - Dave's banned words
   
   It then sets `published`, revalidates `/blog`, the post page, the sitemap and `llms.txt`, and fetches the live URL.
5. Scheduled posts go out on a daily cron.
6. Public pages read published rows and keep their URLs (`/blog/<slug>`), so existing links and search rankings survive.

**The marketing assistant MCP:**
- **Endpoint:** `/api/marketing/mcp`, with the same build as `/api/life/mcp` (stateless, JSON, bearer token `MARKETING_ASSISTANT_TOKEN`).
- **Tools:**
  - `list_posts`, `get_post`, `list_pillars`
  - `create_draft`, `update_draft` (a reason is required, and every change is audited)
  - `run_validation_checks`
  - `generate_hero_image`
  - `suggest_from_journal(date range)`: optional; reads only journal days, like the /life assistant
- **No publish or approve tool.**
- **Brand-aware:** the assistant reads the brand profile before it writes, and every draft names its brand. One token per brand, as in Edge8, so a second brand's assistant never sees the first brand's drafts.
- **Enforced by Postgres:** the `marketing_assistant` role can read brands, profiles, posts and pillars for its token's brand, can insert and update posts only while their `status` is `idea` or `drafted` (checked by row security), and has no access to anything in /life beyond what's listed.

**This repo's structure and docs:**
- Keep the current layout: `src/app`, `src/lib/<area>`, `src/components/<area>`, and `supabase/life/migrations`.
- Add `src/lib/blog/` and `src/app/life/(app)/marketing/`.
- Rewrite `docs/product/epics.md` and `epic-status.md` to cover the public site, /life (journal, travel, health, memories, accounts and addresses, assistant MCP) and marketing.
- Add `docs/plans/` (this file) and `docs/adr/`, starting with "Marketing is rebuilt in-house on the 8 Edges model".
- Add a marketing section to `docs/architecture/`.

**Build phases:**

**Now and later.** This round builds phases 0 to 3: the content core, the cockpit and the assistant. Phases 4 to 7 are planned and kept in this file, but built later, each with its own plan. Every function in the inventory above that isn't in phases 0 to 3 is **later**.

| When | Phase | What |
|---|---|---|
| **Now** | 0 | Docs refresh and this plan agreed |
| **Now** | 1 | **Content core:** migrations (brands and profiles, content assets, campaigns, pillars, images, bucket); import the 15 posts; public blog reads from the database (reader, `/blog`, `/blog/[slug]`, OG images, sitemap, `llms.txt`, revalidation); delete `posts-data.ts` |
| **Now** | 2 | **Marketing cockpit in /life:** overview, calendar (kanban and month), campaigns, post editor, publish gate, approve, schedule, live-edit lock, cron |
| **Now** | 3 | **Marketing assistant MCP** and the `marketing_assistant` role, with denial tests |
| Later | 4 | **Email:** contacts and audiences, broadcasts, approval, send cap and send window, Resend sending and webhook, tracking, unsubscribe, UTM. Fills Epics 7 and 8. |
| Later | 5 | **Recurring series and the weekly letter** |
| Later | 6 | **AI production:** writer pipeline, exhibits, hero images |
| Later | 7 | **Measurement:** social import, recaps, weekly pulse, digest; books as source |

## 4. Determine the ROI

- **FAST goal (proposed, for this round):** by 2026-12-31, every new post is published from /life → Marketing with zero code edits, and the assistant drafts at least one post a week that Dave approves.
- **Success measures:**
  - Posts published per month.
  - Days from idea to live.
  - Share of posts that pass the gate on the first try.
  - Page views per post, from Vercel Analytics.
  - No content deploys.
- **Return:**
  - The blog keeps pace with Dave's work.
  - Edge8's proven marketing rules (SEO gate, version-bound approval) apply to Dave's brand, and to any brand added later.
  - The marketing assistant becomes a second worked example of database-limited AI assistants, which Edge8 can show clients.

## 5. Definition of Done

- All posts are served from the `posts` table. `posts-data.ts` is gone, and every old `/blog/<slug>` URL resolves with the same content.
- A post can go from idea to live, or scheduled, entirely in /life → Marketing, with no deploy.
- The assistant can create and update drafts, and nothing else. Postgres refuses its attempts to publish, approve or touch /life data outside its grant (tested). Every call is logged.
- The docs describe the site, /life and marketing as they are, and an ADR records the decision.
- Deployed through git push to `main`. Dave has the URL of each page, and knows how to connect the assistant.

---

## Decisions needed

1. **Database:** decided: dave-life.
2. **Publish gate:** decided. Required: 600+ words, a hero image, a title tag, a meta description, and 2+ internal links to other `/blog/` posts. An FAQ is optional. The brand's banned words replace "no em dashes".
3. **Order:** settled. Phases 0 to 3 now; email, series, AI production and measurement later.
4. **Migrations folder:** decided: keep `supabase/life/migrations`.
5. **Who broadcasts go to** (for the later email phase): a new subscriber list on this site (newsletter sign-up, plus an import of existing contacts), the shared CRM's `people` from ai-officer.com, or /life's `people`. This decides where audiences and unsubscribes live.
6. **Sending** (for the later email phase): Resend from a davehajdu.com address (domain to verify), or the MailerLite account.
