# 0001 — Marketing is rebuilt in-house on the 8 Edges model

**Date:** 2026-11-08 · **Status:** Accepted · **Plan:** [`../plans/2026-11-08-marketing-on-8-edges.md`](../plans/2026-11-08-marketing-on-8-edges.md)

## Context

Every blog post on davehajdu.com is a hand edit to `src/lib/posts-data.ts` and needs a deploy. Edge8's platform (edge8-web, `entities/campaigns`) already solves publishing: a content calendar, an SEO publish gate, version-bound approval, scheduling, hero images and a publish editor. davehajdu.com is Dave's personal site and database, not an Edge8 brand, so it cannot use that platform directly. The /life assistant MCP (PR 71) showed that an AI assistant can be limited by a Postgres role rather than by code.

## Decision

- Rebuild the marketing features inside this repo, porting Edge8's model and rules rather than calling Edge8.
- Store them in the **dave-life** Supabase project, next to /life, with migrations in `supabase/life/migrations`.
- Keep **brands**: every post, campaign and pillar belongs to a brand, and the brand profile sets how content is written. One brand ("Dave Hajdu") to start.
- Run the cockpit at `/life/marketing`, behind the /life login. Public pages keep their `/blog/<slug>` URLs and read only published rows.
- Give the marketing assistant its own MCP (`/api/marketing/mcp`) and Postgres role, one token per brand. It can draft; it cannot approve or publish.
- Build phases 0 to 3 now (docs, content core, cockpit, assistant). Email, series, AI production and measurement come later, each with its own plan.

## Consequences

- Publishing stops needing deploys; `posts-data.ts` is deleted once the import is verified.
- The public blog now depends on dave-life. The reader is cached and revalidated on publish, so an outage affects new posts, not pages already rendered.
- Edge8 fixes don't flow here automatically; the two codebases diverge after the port.
- dave-life gets a public read path for the first time, limited to published posts through a server-side reader.
