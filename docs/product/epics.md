# Epics — Dave Hajdu

Eight thematic epics. Status is tracked separately in [`epic-status.md`](./epic-status.md).

---

## Epic 1 — Landing & hero

**Thesis:** A senior visitor knows what the founder does and why it matters within three seconds of landing.

**Bundle:** Hero, About, testimonials, stat-strip, navigation.

**Mechanism:** Static Next.js home page with hero copy, headshot, social proof, and clear navigation to the speaker, consulting, and books surfaces.

**Success criterion:** Bounce rate from home stays below industry baseline. Click-through to a CTA (speaker / consulting / books) is the dominant exit path.

---

## Epic 2 — Speaking & booking

**Thesis:** A speaker bureau or event organiser can pitch the founder for a keynote in under a minute.

**Bundle:** `/speaker-topics` page, keynote variant of the InquiryForm, topic library aligned to the four offices.

**Mechanism:** Form submit → `/api/inquiries` POST → `submit_inquiry` RPC → row in shared `inquiries` with `type = 'keynote'`, `source_site = 'davehajdu.com'` → Lark card fires.

**Success criterion:** Median time from form submit to founder reply is under 24 hours. Lost form submissions are zero.

---

## Epic 3 — Consulting sales

**Thesis:** A senior buyer can request a consulting engagement with relevant context already captured.

**Bundle:** `/ai-in-business` page, consultation variant of the InquiryForm, three-pillar narrative.

**Mechanism:** Same pipeline as Speaking — form → RPC with `type = 'consultation'` → Lark.

**Success criterion:** Consultation inquiry quality is high enough that the founder's response rate is above 90%. No inquiry stalls in `new_lead` for more than 7 days.

---

## Epic 4 — Content hub (blog)

**Thesis:** Long-form writing is the proof behind the credibility cues. Readers can find and read the founder's perspective easily.

**Bundle:** `/blog` route group, posts metadata, blog layout, post detail pages.

**Mechanism:** Blog post metadata in `src/lib/posts-data.ts`. Currently the source is hardcoded TypeScript — a CMS or MDX integration is a future call.

**Success criterion:** New posts publish without manual code edits beyond adding the data row. Blog pageviews per post trend up.

---

## Epic 5 — Books & presales

**Thesis:** Surface the founder's books, link to purchase, capture reader interest.

**Bundle:** `/books` page, two-book showcase, links to retailers.

**Mechanism:** Static page with book metadata; outbound links to retailer (Amazon, etc.). No native commerce.

**Success criterion:** Click-through to retailer is measurable. Future presale interest can be captured via an inquiry-form variant.

---

## Epic 6 — Lead capture & CRM sync

**Thesis:** Every inquiry — keynote, consultation, general — lands in the shared CRM and notifies the founder within seconds.

**Bundle:** `/api/inquiries` POST handler, payload validation, Supabase insert via RPC, Lark card notification.

**Mechanism:** The same `submit_inquiry` RPC used by every AIO-LLC site. `source_site = 'davehajdu.com'` is set on every payload. Lark webhook is non-fatal — the DB write succeeds first.

**Success criterion:** Zero dropped inquiries. Every form variant (keynote, consultation, general) routes through the same handler with correct typing.

---

## Epic 7 — Email & onboarding

**Thesis:** Inquirers receive immediate confirmation and the founder's first-touch context, so the conversation starts warm.

**Bundle:** Resend client, transactional email templates, post-inquiry sequence.

**Mechanism:** On successful inquiry, send a Resend confirmation email. Future: a 2–3 step welcome sequence depending on inquiry type.

**Success criterion:** Confirmation email open rate above 60%. No inquiries arrive without confirmation. Sequence open rates measured per type.

---

## Epic 8 — Newsletter

**Thesis:** Build a direct-to-audience email list independent of social platforms.

**Bundle:** Subscribe form, list capture in shared CRM, downstream broadcast tool.

**Mechanism:** TBD. Currently no subscribe form exists on the site (as of audit 2026-04-29). May ultimately live on caiocoach.com instead — see open questions in [`epic-status.md`](./epic-status.md).

**Success criterion:** Subscriber count is measurable per month. New posts or memos broadcast without manual list export.
