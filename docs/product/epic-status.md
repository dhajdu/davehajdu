# Epic Status — Dave Hajdu

At-a-glance status of the epics in [`epics.md`](./epics.md), from a code audit on 2026-11-08.

| # | Epic | Status | Evidence |
|---|---|---|---|
| 1 | Landing & hero | ✅ | `src/app/page.tsx` renders Hero, About, Speaking, Books, BlogPreview, ContactCTA. |
| 2 | Speaking & booking | ✅ | `/speaker-topics`, `/book-keynote`; keynote form → `/api/inquiries` → `leads` + Lark card. |
| 3 | Consulting sales | ✅ | `/ai-in-business`, `/schedule-consultation`; same pipeline. |
| 4 | Blog (public reading) | 🔄 | 15 posts in `posts-data.ts`, `/blog`, `/blog/[slug]`, `llms.txt`. Still needs a code change per post; moves to the database in Epic 15. |
| 5 | Books & presales | 📋 | `/books` shows two covers marked "Summer 2026". No retailer links; the CTA is the contact form. |
| 6 | Lead capture | ✅ | `/api/inquiries` whitelists fields, inserts into `leads`, sends a Lark card. |
| 7 | Email & onboarding | 🆕 | No Resend code. Later: marketing phase 4. |
| 8 | Newsletter & broadcasts | 🆕 | No subscribe form. Later: marketing phases 4 and 5. |
| 9 | The loop | ✅ | Today, Journal, Goals, Review and EO pages; monthly review cron. |
| 10 | Travel | ✅ | Upcoming, past, map, trip detail with Delete trip; TripIt cron compares content with sorted keys (PR 70). |
| 11 | Health | ✅ | Fitness and Medical pages; Apple Health ingest; weight and blood sugar metrics. |
| 12 | Memories, timeline & Ask | ✅ | Photos picker and import, timeline, Ask over `life_reader`, sources page. |
| 13 | Accounts & addresses | ✅ | `logins` and `addresses` tables and pages (PR 69). |
| 14 | Personal assistant MCP | ✅ | `/api/life/mcp`, 12 tools, `life_assistant` role, tested on production (PR 71). |
| 15 | Content core | 📋 | Planned, marketing phase 1. |
| 16 | Marketing cockpit | 📋 | Planned, marketing phase 2. |
| 17 | Marketing assistant MCP | 📋 | Planned, marketing phase 3. |

## Glyph legend

| Glyph | Meaning |
|---|---|
| ✅ | Shipped and in production |
| 🔄 | In progress or partly wired |
| 📋 | Planned |
| 🆕 | Not yet planned in detail |

## Gaps

1. **The blog needs a deploy per post** (Epic 4). Fixed by Epics 15 and 16.
2. **No email** (Epics 7 and 8). Planned for marketing phase 4; who receives broadcasts and which sender is used are decided then.
3. **Books are visual only** (Epic 5). No plan yet.
