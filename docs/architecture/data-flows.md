# Data Flows — Dave Hajdu

davehajdu.com is a credibility-and-capture site. It owns no database schema. Inquiries flow into the shared CRM via Supabase RPC, the founder is notified via Lark, and Resend handles transactional email.

---

## Form pipeline

Three form variants share one handler at `/api/inquiries`:

| Variant | Inquiry type | Where it lives |
|---|---|---|
| Keynote | `keynote` | `/speaker-topics` |
| Consultation | `consultation` | `/ai-in-business` |
| General | `general` | `/contact` (or any embedded inquiry CTA) |

All variants POST to `/api/inquiries`. The handler validates the payload, calls the `submit_inquiry` RPC on the shared Supabase instance, then fires a Lark webhook with a card formatted per inquiry type.

Every payload sets `source_site = 'davehajdu.com'`.

The Lark call is non-fatal — if Lark is unreachable, the inquiry is still recorded in the shared CRM.

Canonical schema and RPC contract: [aio-website/docs/architecture/database-schema.md](../../../aio-website/docs/architecture/database-schema.md).

---

## Email and onboarding

Resend is wired in `src/lib/email.ts` (or equivalent). Transactional confirmation emails are sent after a successful inquiry. Sequence templates and cadence are TBD — see Epic 7 in [`epics.md`](../product/epics.md).

---

## What this site does NOT own

- The `people`, `inquiries`, `activity_log` tables (owned by ai-officer.com migrations).
- Inquiry-pipeline state transitions (handled in the AIO admin console).
- Book commerce (lives at external retailers).
- Newsletter broadcast (TBD; not yet wired).

---

## Cross-references

- Canonical schema: [aio-website/docs/architecture/database-schema.md](../../../aio-website/docs/architecture/database-schema.md).
- Multi-brand vision: [aio-website/docs/product/product.md](../../../aio-website/docs/product/product.md).
- Inquiry handler: `src/app/api/inquiries/route.ts`.
