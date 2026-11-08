# Dave Hajdu — Documentation Index

**Project:** davehajdu.com
**Stack:** Next.js 16 · TypeScript · Supabase (leads, dave-life) · Lark
**Owner:** Dave Hajdu (AI Officer LLC, Idaho)
**Last updated:** 2026-11-08

davehajdu.com is one of three brands operated by AI Officer LLC. The shared CRM (Supabase `people` + `inquiries` tables) is owned by ai-officer.com — see [aio-website/docs/architecture/database-schema.md](../../../aio-website/docs/architecture/database-schema.md). Inquiries from this site arrive there with `source_site = 'davehajdu.com'`.

The same app also runs **/life**, Dave's private operating system, and (from the marketing plan) the **marketing** cockpit that publishes the blog. Both use the dave-life Supabase project.

---

## Product

| Document | Contents |
|---|---|
| [Product](./product/product.md) | Vision: audiences, values, business model |
| [Epics](./product/epics.md) | Seventeen epics across the public site, /life and marketing |
| [Epic Status](./product/epic-status.md) | At-a-glance completion dashboard |

---

## Architecture

| Document | Contents |
|---|---|
| [Data Flows](./architecture/data-flows.md) | Public site: form pipeline, `leads`, Lark |
| [/life](./architecture/life.md) | /life model, schema, workflows, routes, assistant MCP |
| [Marketing](./architecture/marketing.md) | Blog and email: today, target tables, publish gate, cockpit, assistant MCP |

---

## Plans

| Document | Contents |
|---|---|
| [Marketing on 8 Edges](./plans/2026-11-08-marketing-on-8-edges.md) | 5 Ds plan: phases 0 to 3 now, 4 to 7 later |

---

## Decisions

| Document | Contents |
|---|---|
| [ADR index](./adr/README.md) | Architecture decision records |
| [0001](./adr/0001-marketing-on-8-edges.md) | Marketing is rebuilt in-house on the 8 Edges model |

---

## Features

| Document | Contents |
|---|---|
| _(none yet)_ | |

---

## Engineering

| Document | Contents |
|---|---|
| _(none yet)_ | |

---

## QA

| Document | Contents |
|---|---|
| [QA Plan](./qa/qa-plan.md) | Tiered test plan |

---

## Brand

| Document | Contents |
|---|---|
| [Brand Resources README](./brand/README.md) | Roadmap for content-calendar, brand-voice, design-system, audience-personas, pricing-strategy |
