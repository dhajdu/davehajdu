# Epic Status — Dave Hajdu

At-a-glance dashboard of the eight epics in [`epics.md`](./epics.md). Status is grounded in a code-level audit (2026-04-29).

| # | Epic | Status | % | Evidence |
|---|---|---|---|---|
| 1 | Landing & hero | ✅ | 100 | `src/app/page.tsx` renders Hero, About, Speaking, Books, BlogPreview, ContactCTA — full wiring, copy final. |
| 2 | Speaking & booking | ✅ | 100 | `/speaker-topics` complete. InquiryForm with `type='keynote'` → `/api/inquiries` → Supabase insert + Lark webhook with colour-coded card. |
| 3 | Consulting sales | ✅ | 100 | `/ai-in-business` complete. `/schedule-consultation` InquiryForm with `type='consultation'` → same RPC pipeline → Lark fires. |
| 4 | Content hub (blog) | ✅ | 100 | `/blog` route with 7 posts in `posts-data.ts`, full content blocks, category filter, post detail pages at `/blog/[slug]`. |
| 5 | Books & presales | 📋 | 30 | `/books` page shows two book covers with `available: 'Summer 2026'` hardcoded. **No retailer links wired.** "Get notified" CTA is just the contact form — no book-specific waitlist. |
| 6 | Lead capture & CRM sync | ✅ | 100 | `/api/inquiries` validates payload, inserts to Supabase `leads` table, fires Lark webhook for keynote/consultation/general. Field whitelist enforced. |
| 7 | Email & onboarding | 🆕 | 0 | No Resend integration found. Form success state shows a WhatsApp link only. **No transactional confirmation, no sequence.** |
| 8 | Newsletter | 🆕 | 0 | No subscribe form anywhere in the codebase. No newsletter component. No collection logic. Open question: should this live on caiocoach.com instead? |

---

## Glyph legend

| Glyph | Meaning |
|---|---|
| ✅ | Shipped — fully wired, in production |
| 🔄 | In progress — partial wiring, gaps to close |
| 📋 | Planned — skeleton exists but not wired |
| 🆕 | Needs planning — not defined in code |

---

## Critical gaps flagged in audit

1. **Email is a stub (Epic 7).** Inquirers see a WhatsApp link, not a transactional confirmation. The Resend integration promised in the epic doc has no code behind it.
2. **Books are visual-only (Epic 5).** Two book covers with placeholder dates and no retailer links. No native presale capture.
3. **Newsletter is undefined (Epic 8).** Should this be planned for davehajdu.com or moved to caiocoach.com? Decision before further docs.

---

## Recommendation

Consider collapsing Epics 7 and 8 into a single "Post-inquiry communication" epic that decides: (a) Do you want Resend transactional confirmations? (b) Do you want a newsletter signup here, or only on caiocoach.com? The current split creates work-in-progress sprawl without clear dependencies.

---

## Audit basis

Code-level audit on 2026-04-29 across `src/app/`, `src/components/`, `src/lib/`, and `src/app/api/`. Percentages reflect production wiring, not test coverage.
