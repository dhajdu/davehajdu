# Epics — Dave Hajdu

davehajdu.com is three things in one Next.js app: the **public site** (credibility and capture), **/life** (Dave's private operating system) and **marketing** (the blog and, later, email, run from inside /life). Status is tracked in [`epic-status.md`](./epic-status.md).

---

# Public site

## Epic 1 — Landing & hero

**Thesis:** A senior visitor knows what Dave does and why it matters within three seconds of landing.

**Bundle:** Hero, About, testimonials, stat strip, navigation.

**Mechanism:** Static home page with hero copy, headshot, social proof and clear paths to speaking, consulting and books.

**Success criterion:** Click-through to a CTA (speaker, consulting, books) is the dominant exit path.

---

## Epic 2 — Speaking & booking

**Thesis:** An event organiser can pitch Dave for a keynote in under a minute.

**Bundle:** `/speaker-topics`, `/book-keynote`, keynote variant of the InquiryForm.

**Mechanism:** Form → `/api/inquiries` → row in `leads` with `inquiry_type = 'keynote'` → Lark card.

**Success criterion:** Median time from submit to reply under 24 hours. Zero lost submissions.

---

## Epic 3 — Consulting sales

**Thesis:** A senior buyer can request a consulting engagement with the context already captured.

**Bundle:** `/ai-in-business`, `/schedule-consultation`, consultation variant of the InquiryForm.

**Mechanism:** Same pipeline as Epic 2 with `inquiry_type = 'consultation'`.

**Success criterion:** Reply rate above 90%; no inquiry waits more than 7 days.

---

## Epic 4 — Blog (public reading)

**Thesis:** Long-form writing is the proof behind the credibility cues. Readers can find and read Dave's perspective easily, and search engines and AI crawlers can too.

**Bundle:** `/blog`, `/blog/[slug]`, OG images, sitemap, `llms.txt`.

**Mechanism:** Today, posts are hard-coded in `src/lib/posts-data.ts`. From marketing phase 1 the pages read published rows from the `posts` table in dave-life and keep their URLs.

**Success criterion:** A new post goes live without a code change or deploy. Page views per post trend up.

---

## Epic 5 — Books & presales

**Thesis:** Surface Dave's books, link to purchase, capture reader interest.

**Bundle:** `/books`.

**Mechanism:** Static page with book metadata and outbound retailer links. No native commerce.

**Success criterion:** Retailer click-through is measurable; presale interest is captured.

---

## Epic 6 — Lead capture

**Thesis:** Every inquiry lands in the database and notifies Dave within seconds.

**Bundle:** `/api/inquiries`, payload whitelist, `leads` insert, Lark card.

**Mechanism:** One handler for keynote, consultation and general. The Lark call is non-fatal; the database write comes first.

**Success criterion:** Zero dropped inquiries.

---

## Epic 7 — Email & onboarding

**Thesis:** Inquirers get an immediate confirmation, so the conversation starts warm.

**Mechanism:** Delivered by marketing phase 4 (email): Resend sending, transactional confirmation, then short sequences by inquiry type.

**Success criterion:** Every inquiry gets a confirmation.

---

## Epic 8 — Newsletter & broadcasts

**Thesis:** A direct-to-audience list that doesn't depend on social platforms.

**Mechanism:** Delivered by marketing phase 4 (audiences, broadcasts, approval, send cap and window, unsubscribe, tracking) and phase 5 (the weekly letter). Who broadcasts go to and which sender is used are decided at the start of phase 4.

**Success criterion:** Subscribers measurable per month; a new post can be broadcast without exporting a list.

---

# /life

Private, one owner, at `/life`. Engineering plan: [`../architecture/life.md`](../architecture/life.md).

## Epic 9 — The loop (Today, Journal, Goals, Review)

**Thesis:** Capture, review, reflect and set goals in one place, so each month starts from what actually happened.

**Bundle:** `/life` (Today, the One Thing, to-dos), `/life/journal`, `/life/goals`, `/life/review`, EO forum and presentations.

**Mechanism:** Areas, records, measurements and entries in dave-life with row security; the monthly review draft is written by a cron.

**Success criterion:** The month's review draft is waiting on the 1st and takes under 15 minutes to finish.

---

## Epic 10 — Travel

**Thesis:** Every trip, past and upcoming, is complete and correct without manual entry.

**Bundle:** `/life/travel` (upcoming, past, map, trip detail with delete), Gmail travel sweep, TripIt feed.

**Mechanism:** Raw source items → extraction → trips and legs, with conflicts sent to the inbox. The TripIt cron only re-raises an item when its content changes.

**Success criterion:** New bookings appear within an hour; resolved items stay resolved.

---

## Epic 11 — Health

**Thesis:** Weight, blood sugar, activity and bloodwork are tracked over time against ranges.

**Bundle:** `/life/health`, `/life/health/medical`, Apple Health ingest.

**Success criterion:** Daily metrics arrive without manual entry; lab results are searchable.

---

## Epic 12 — Memories, timeline & Ask

**Thesis:** Dave's history is searchable and answerable.

**Bundle:** `/life/memories` (Google Photos picker and import), `/life/timeline`, `/life/ask` (Claude over the read-only `life_reader` role), `/life/sources`.

**Success criterion:** Ask answers with sources and cannot write.

---

## Epic 13 — Accounts & addresses

**Thesis:** One inventory of every online account and postal address, with no secrets in it.

**Bundle:** `/life/settings/accounts`, `/life/settings/addresses`.

**Mechanism:** `logins` and `addresses` tables, owner-only, not readable by Ask. Passwords stay in the password manager; `vault_ref` says where.

**Success criterion:** Every account is listed with owner entity and status; no secret is ever stored.

---

## Epic 14 — Personal assistant MCP

**Thesis:** Dave's assistant bot can read and update chosen parts of /life, and nothing else.

**Bundle:** `/api/life/mcp`, 12 tools, the `life_assistant` Postgres role.

**Mechanism:** Fixed queries run as `life_assistant`; row security limits it to journal entries, to-dos, travel, goals, and weight and blood sugar. Every call is logged.

**Success criterion:** Denied reads and writes are refused by Postgres, not by code.

---

# Marketing

Rebuilt in-house on the 8 Edges model: [`../adr/0001-marketing-on-8-edges.md`](../adr/0001-marketing-on-8-edges.md). Plan: [`../plans/2026-11-08-marketing-on-8-edges.md`](../plans/2026-11-08-marketing-on-8-edges.md).

## Epic 15 — Content core (phase 1, now)

**Thesis:** Posts live in the database with their brand, so publishing needs no code.

**Bundle:** `brands`, `brand_profiles`, `posts`, campaigns, pillars, images, a storage bucket; the 14 existing posts imported; Epic 4's pages reading from it.

**Success criterion:** `posts-data.ts` is gone and every old `/blog/<slug>` URL still resolves.

---

## Epic 16 — Marketing cockpit (phase 2, now)

**Thesis:** A post goes from idea to live, or scheduled, entirely inside /life.

**Bundle:** `/life/marketing`: overview, calendar, campaigns, post editor, publish gate, version-bound approval, scheduling, live-edit lock, daily cron.

**Success criterion:** The gate (600+ words, hero image, title tag, meta description, 2+ internal `/blog/` links, brand banned words) blocks any post that fails it.

---

## Epic 17 — Marketing assistant MCP (phase 3, now)

**Thesis:** An assistant keeps the blog current by drafting in Dave's voice, and can never publish.

**Bundle:** `/api/marketing/mcp`, the `marketing_assistant` role, one token per brand.

**Success criterion:** It drafts at least one post a week that Dave approves; Postgres refuses its attempts to publish, approve or read /life beyond its grant.

---

## Later (phases 4 to 7)

Email (Epics 7 and 8), recurring series and the weekly letter, AI production (writer, exhibits, hero images) and measurement (social import, recaps, weekly pulse, digest). Each gets its own plan before work starts.
