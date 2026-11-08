# Data Flows — Dave Hajdu

The public site is a credibility-and-capture site. Inquiries are inserted into the `leads` table and the founder is notified via Lark. There is no transactional email yet. /life and marketing use a separate Supabase project, dave-life: see [life.md](./life.md) and [marketing.md](./marketing.md).

---

## Form pipeline

Three form variants share one handler at `/api/inquiries`:

| Variant | Inquiry type | Where it lives |
|---|---|---|
| Keynote | `keynote` | `/speaker-topics` |
| Consultation | `consultation` | `/ai-in-business` |
| General | `general` | `/contact` (or any embedded inquiry CTA) |

All variants POST to `/api/inquiries`. The handler validates the payload against a field whitelist, inserts a row into `leads`, then fires a Lark webhook with a card formatted per inquiry type.

Every payload sets `source_site = 'davehajdu.com'`.

The Lark call is non-fatal — if Lark is unreachable, the inquiry is still recorded in the shared CRM.

Canonical schema and RPC contract: [aio-website/docs/architecture/database-schema.md](../../../aio-website/docs/architecture/database-schema.md).

---

## Email and onboarding

Not built. The form's success state shows a WhatsApp link. Resend confirmations, sequences and broadcasts are marketing phase 4 — see Epics 7 and 8 in [`epics.md`](../product/epics.md).

---

## What this site does NOT own

- The `people`, `inquiries`, `activity_log` tables (owned by ai-officer.com migrations).
- Inquiry-pipeline state transitions (handled in the AIO admin console).
- Book commerce (lives at external retailers).
- Newsletter broadcast (marketing phase 4; not yet wired).

---

## Cross-references

- Canonical schema: [aio-website/docs/architecture/database-schema.md](../../../aio-website/docs/architecture/database-schema.md).
- Multi-brand vision: [aio-website/docs/product/product.md](../../../aio-website/docs/product/product.md).
- Inquiry handler: `src/app/api/inquiries/route.ts`.
