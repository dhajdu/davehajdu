# /life: development plan

Engineering plan for the product brief in [`life-plan.html`](./life-plan.html) (5Ds AI Program Brief, Draft 2). The brief says what and why; this file says how, in PR slices with gates. Phase 1 is planned in full; Phases 2 and 3 are outlined.

Private personal operating system at `davehajdu.com/life`. One owner, one login, nothing public.

## Model

Ten **areas** (body, mind, people, money, work, places, time, direction, admin, legacy). Every area holds three kinds of data:

- **Records**: things that happened (`records`, plus `trips` / `trip_legs` for Places).
- **Measurements**: metrics over time (`metrics` definitions + `measurements` rows).
- **Entries**: reflections (journal, EO updates, learnings).

**Direction** (`goals`, `reviews`, `review_scores`) sits on top. The product is the loop: capture → monthly review → reflect → set goals.

All ingestion goes through one raw inbox (`source_items`), then Claude extraction, then either the target tables or `review_queue`. Areas, metrics and sources are rows, not code: a new metric or source is an insert, not a migration.

## Phases

| Phase | Areas | Sources |
|---|---|---|
| **1 · The loop** | Direction, Mind, Body, Places | Notion, Apple Health, Gmail travel, TripIt |
| 2 · People and money | People, Money, Work, Admin | Contacts, Calendar, LinkedIn, statements, Drive scans, Gmail admin |
| 3 · Memory | Legacy, Time, rest of Mind | Google Photos Picker / Takeout, Forever, calendar time, Readwise, Maps Timeline |

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Database | New Supabase project `dave-life` (Singapore) | Separate from the `leads` project and its keys |
| Hosting | Same Next.js 16 app, `/life/*` | One deploy; ship flow unchanged |
| Auth | Supabase Auth, allowlist of one email (`LIFE_OWNER_EMAIL`), emailed link or code, no MFA (owner's call) | One user |
| Data access | RLS on every table (`owner_id = auth.uid()`). Request-path code uses the publishable key + user session. Secret key only in ingest routes and scripts | A broken page cannot leak rows |
| Files | Private bucket `life-files`, signed URLs (5 min) | |
| Gmail | Google Apps Script in dhajdu@gmail.com, hourly, POSTs to `/api/life/ingest` | No OAuth app, no 7-day token expiry |
| Apple Health | Health Auto Export (iOS) REST automation → `/api/life/ingest/health` | Daily aggregates without a native app |
| Notion | One-time import, then nightly sync keyed on page id | Dave keeps writing in Notion |
| Extraction | Claude (`claude-sonnet-5-5`), structured output; confidence below 0.8 or any conflict → `review_queue` | Ask before guessing |
| Ask | Claude tool use over a read-only Postgres role `life_reader` | Can read everything, write nothing |
| Home base | `HOME_AIRPORT=SGN` (Saigon since 2006) | Trip boundaries |
| SEO | `noindex`, excluded from `sitemap.ts` and `robots.ts` | |
| UI | `globals.css` tokens only. White background, no dark mode | Site design system |

Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing `proxy.ts`, route handlers or cron config.

## Env vars

```
NEXT_PUBLIC_LIFE_SUPABASE_URL=
NEXT_PUBLIC_LIFE_SUPABASE_PUBLISHABLE_KEY=
LIFE_SUPABASE_SECRET_KEY=          # ingest routes + scripts only
LIFE_OWNER_EMAIL=
LIFE_INGEST_SECRET=                # shared with Apps Script and Health Auto Export
NOTION_TOKEN=                      # internal integration shared with Journal + EO Updates
ANTHROPIC_API_KEY=
TRIPIT_ICAL_URL=                   # already in .env.local
HOME_AIRPORT=SGN
CRON_SECRET=                       # Vercel cron auth
```

## Schema

Every table: `id uuid pk default gen_random_uuid()`, `owner_id uuid not null default auth.uid() references auth.users`, `created_at`, `updated_at`, RLS enabled with one owner-only policy for all commands. Every column gets a `comment on column` (Ask reads them). Phase 1 creates all tables below so later phases are data, not migrations, except where marked.

### Frame

| Table | Columns |
|---|---|
| `areas` | `slug unique`, `name`, `sort_order`, `description`. Seed the ten areas |
| `metrics` | `area_id`, `slug unique`, `name`, `unit`, `aggregation` (`avg` \| `sum` \| `last`), `direction` (`higher_better` \| `lower_better` \| `target`), `source_id` |
| `tags`, `taggables` | `name`, `color`; `tag_id`, `entity_type`, `entity_id` |

Phase 1 metric seed: `weight_kg`, `body_fat_pct`, `steps`, `workouts`, `active_kcal`, `sleep_hours`, `resting_hr`, `hrv_ms`, `journal_entries`, `nights_away`, `trips`.

### Records, measurements, entries

| Table | Columns |
|---|---|
| `records` | `area_id`, `kind` (`surgery` \| `job` \| `move` \| `milestone` \| `company` \| ...), `title`, `started_on`, `ended_on`, `date_precision` (`day` \| `month` \| `year` \| `approx`), `place_id`, `notes`, `source_item_id` |
| `measurements` | `metric_id`, `measured_on date`, `value numeric`, `source_item_id`; unique (`metric_id`, `measured_on`) |
| `entries` | `area_id`, `kind` (`journal` \| `eo_update` \| `learning` \| `presentation` \| `reference` \| `note`), `entry_date`, `title`, `body_md`, `external_id unique` (Notion page id), `notion_tags text[]`, `search tsvector generated` + GIN |

### Direction

| Table | Columns |
|---|---|
| `goals` | `area_id`, `title`, `horizon` (`30d` \| `60d` \| `week` \| `month` \| `year` \| `vision`), `period` (`YYYY-MM` for month goals, the Monday for week goals), `focus` (the period's One Thing), `track` (`health` \| `business`: every rung of the ladder carries one of each; backfilled from the area, body and mind being health), `metric_id`, `target_value`, `due_on`, `status` (`open` \| `hit` \| `missed` \| `dropped`), `review_id` (set in) |
| `reviews` | `period` (`YYYY-MM`, unique), `one_word`, `headline`, `status` (`draft` \| `done`), `auto_summary jsonb`, `entry_id` (source EO update, if imported) |
| `review_scores` | `review_id`, `area_id`, `score numeric(3,1)`, `feelings`, `headline`, `impact`; unique (`review_id`, `area_id`) |

EO's five scores map to areas: Physical → body, Mental → mind, Financial → money, Friends/Family → people, Professional → work.

### Area detail

| Table | Phase | Columns |
|---|---|---|
| `places` | 1 | `name`, `city`, `country`, `lat`, `lng`, `kind` (`home` \| `hotel` \| `airport` \| `venue` \| `city`), `iata` |
| `trips` | 1 | `title`, `start_on`, `end_on`, `primary_place_id`, `purpose` (`business` \| `personal` \| `unknown`), `notes` |
| `trip_legs` | 1 | `trip_id`, `kind` (`flight` \| `hotel` \| `train` \| `car` \| `event`), `status` (`confirmed` \| `changed` \| `cancelled`), `confirmation_code`, `provider`, `number`, `origin_place_id`, `destination_place_id`, `starts_at timestamptz`, `start_tz`, `ends_at`, `end_tz`, `address`, `source_item_id`, `raw jsonb`; unique (`kind`, `confirmation_code`, `number`, `(starts_at at time zone start_tz)::date`) |
| `people` | 1 (table only) | `name`, `relationship`, `closeness` (1 to 5), `how_met`, `birthday`, `contact jsonb`, `contact_every_days`, `notes` |
| `interactions` | 2 | `person_id`, `happened_at`, `kind` (`meeting` \| `call` \| `trip` \| `message`), `record_id`, `notes` |
| `accounts` | 2 | `name`, `institution`, `kind` (`bank` \| `card` \| `brokerage` \| `loan` \| `property` \| `crypto`), `currency`, `is_liability` |
| `balances` | 2 | `account_id`, `as_of`, `balance`, `balance_usd`, `fx_rate`, `source_item_id`; unique (`account_id`, `as_of`) |
| `obligations` | 2 | `title`, `kind`, `expires_on`, `renews_on`, `remind_days_before`, `document_id` |
| `media` | 3 | `storage_path`, `taken_at`, `place_id`, `caption`, `width`, `height` |

### Plumbing

| Table | Columns |
|---|---|
| `sources` | `slug unique` (`gmail`, `notion`, `apple_health`, `tripit`, ...), `name`, `method`, `cadence`, `last_run_at`, `last_status`, `cursor jsonb`, `enabled` |
| `source_items` | `source_id`, `external_id`, `received_at`, `payload jsonb`, `processed_at`, `extraction jsonb`, `error`; unique (`source_id`, `external_id`) |
| `review_queue` | `source_item_id`, `area_id`, `kind`, `proposed jsonb`, `confidence`, `reason`, `status` (`pending` \| `approved` \| `rejected` \| `edited`), `resolved_at` |
| `documents` | `storage_path`, `mime`, `title`, `doc_date`, `text`, `source_item_id` |
| `links` | `from_type`, `from_id`, `to_type`, `to_id`, `relation` (`mentions` \| `attached` \| `during` \| `with`) |
| `workflow_runs` | `workflow`, `started_at`, `finished_at`, `status`, `items_in`, `items_out`, `error` |

Plus role `life_reader` (NOLOGIN, used via `set role` in a security-definer function or a dedicated connection) with SELECT on all tables and nothing else.

## Workflows

| ID | Workflow | Trigger | Implementation | Phase |
|---|---|---|---|---|
| W1 | Gmail sweep | Hourly | `apps-script/life-gmail.gs` (synced with `clasp`) → `POST /api/life/ingest` | 1 (travel), 2 (admin, statements) |
| W2 | Notion sync | Nightly 02:00 ICT + one-time import | `scripts/life/notion-import.ts`, cron route `/api/life/cron/notion` | 1 |
| W3 | Extract and route | Each new `source_item` | `src/lib/life/extract/*` called from the ingest route | 1 |
| W4 | Health sync | Daily push | Health Auto Export → `POST /api/life/ingest/health` | 1 |
| W5 | Trip builder | After any `trip_legs` write | `src/lib/life/trips.ts` | 1 |
| W6 | Monthly review draft | 1st of month 06:00 ICT | cron route `/api/life/cron/review` | 1 |
| W7 | Statement ingest | Statement email or upload | extractor in W3 + `/life/upload` | 2 |
| W8 | Nudges | Mondays 07:00 ICT | cron route `/api/life/cron/nudges`, email digest | 2 |
| W9 | Photo curation | Monthly / trip end | Google Photos Picker session → copy to bucket | 3 |
| W10 | Ask | On demand | `/life/ask`, ported from 8edges admin-chat | 1 |

Every workflow writes a `workflow_runs` row and updates `sources.last_run_at` / `last_status`.

### W1 Gmail sweep (Phase 1 scope: travel)

- Query: `-label:life/ingested newer_than:2d (category:travel OR subject:(itinerary OR "booking confirmation" OR "e-ticket" OR reservation OR "your trip" OR "check-in" OR cancelled OR "schedule change"))`.
- Each message: `{ source: "gmail", external_id: messageId, received_at, payload: { from, subject, body_text } }`, `Authorization: Bearer LIFE_INGEST_SECRET`. On 2xx, add label `life/ingested`.
- Backfill: same query without `newer_than`, walked in monthly `after:/before:` windows from 2006-01, cursor in Script Properties (6-minute execution limit, resumes next trigger).

### W2 Notion sync

- Sources: Journal `collection://513ede69-60b8-45b3-ba9d-f101aa849ac3` (579 pages, 2021 to now), EO Updates `collection://325a1d3c-1632-44d6-b146-606fe9fe9816` (65 pages).
- **Template stripping:** daily pages are about 70k characters, mostly carried-forward template. Hash each top-level block (normalised text). Blocks that appear on 5 or more pages are template: store each distinct one once as a `reference` entry, drop it from the page body. Skip `synced-block-reference` content.
- Journal: day's blocks → `entries` (`kind=journal`, area from Notion `Tag`, default mind). `Weight` → `measurements` (`weight_kg`).
- EO Updates: page → `entries` (`kind=eo_update`) and a `reviews` row for its month with `review_scores` from the five properties and `one_word`. The synced Learnings block is split by h3 toggle into one `learning` entry per meeting (dedupe by toggle title). Linked presentation pages → `presentation` entries.
- Date: parse from title first ("Sugar Forum: Aug 23", "Forum Shadow - Oct 8"), else `createdTime`. Several `Created Date` values are wrong; title wins.
- Anomalies go to `review_queue`, never silently fixed: scores above 10 (three 2026 rows with 76, likely kg), title year 2028, title/created-date mismatch over 45 days.
- Idempotent on `external_id`. Nightly run fetches pages edited in the last 48 hours.

### W3 Extract and route

- Classifier → kind (`flight`, `hotel`, `train`, `car`, `event`, `cancellation`, `change`, `not_travel`). `not_travel` marks the item processed and stops.
- Extractor returns legs with `confidence`. Upsert on the `trip_legs` unique key; `change` updates times, `cancellation` sets `status=cancelled`.
- Conflicts → `review_queue`: overlapping hotel nights, two return legs for the same trip, a leg with no resolvable airport.
- Sample at least five real emails each from Vietnam Airlines, Qatar, Thai, Agoda, Booking.com and Marriott before finalising the prompt; keep them as redacted fixtures in `src/lib/life/extract/__fixtures__/`.

### W4 Health sync

- Health Auto Export REST automation, daily, JSON, aggregated by day, metrics: step count, active energy, sleep analysis, resting heart rate, HRV, body mass, body fat, workouts.
- Route maps each to a `metrics.slug` and upserts `measurements` on (`metric_id`, `measured_on`). Re-sends overwrite.
- Initial backfill: one manual export of full history through the same route.

### W5 Trip builder

- Order non-cancelled legs by `starts_at`. A trip opens on a leg departing `HOME_AIRPORT` (or a hotel outside Saigon with no open trip) and closes on the leg arriving at `HOME_AIRPORT`.
- Title `"{primary city}, {Mon YYYY}"`; primary city = most hotel nights, else first destination. User edits to title or purpose are never overwritten (`title_locked`).
- After grouping: `links` (`during`) from the trip to journal entries dated inside it; `nights_away` and `trips` measurements recomputed for affected months.

### W6 Monthly review draft

- For the previous month: each Phase 1 metric's value vs prior month and 12-month average; trips and nights away; journal entry count and recurring themes (Claude over that month's entries); open goals and whether their metric hit target.
- Writes `reviews` (`status=draft`, `auto_summary`), marks due goals `hit`/`missed`, emails a link to `LIFE_OWNER_EMAIL`.
- "Copy as EO update" renders the review in the EO template layout as markdown.

### W10 Ask

Port from `~/code-projects/8edges`: `lib/admin-chat/` (`tools.ts`, `schema.ts`, `system-prompt.ts`, `db.ts`) and `supabase/migrations/20260715120000_admin_chatbot_reader.sql`. Replace the multi-tenant schema context with the `dave-life` column comments. Every answer lists the rows it used as links.

## Reuse from 8edges

8edges is Next 14 and multi-tenant; copy patterns, not files wholesale.

| From (`~/code-projects/8edges`) | Use |
|---|---|
| `lib/admin-chat/`, `20260715120000_admin_chatbot_reader.sql` | W10 Ask + `life_reader` |
| `middleware.ts`, `lib/admin-auth.ts` | `proxy.ts` + `requireOwner()` |
| `20260720160000_team_chatbot_reader_and_knowledge.sql` | GIN `tsvector` pattern for `entries` |
| `tags` / `taggables` | Same shape |
| `20260828150000_data_dictionary_column_comments.sql` | Column-comment pattern |
| `lib/resume-screen.ts` | PDF to Claude for surgery documents (Phase 1 records) and statements (Phase 2) |

## Routes

```
src/app/life/
  layout.tsx            requireOwner(), sidebar, noindex
  page.tsx              Today: the One Thing ladder, the health foundation, month goals
  journal/[date]/       The day, written in the app: One Thing, gratitude, No Holds Barred,
                        the to-do list (todos table), weight; a rail with vision, year, month
                        and the pinned reference blocks. Notion-synced days show read-only
  eo/, eo/[id]/         EO updates: the forum updates with scores and presentations, apart
                        from the journal and the month-end review
  goals/                Goals, two tabs: the climb (hero), this week, the month, the year and the
                        five-year vision, in health and business columns (goals table; month and
                        week goals carry period + focus). goals/record: the track record, one
                        card per past month (app goals, the journal's Historical block, the
                        month-end grades; src/lib/life/record.ts)
  review/, review/[period]/  Month-end review in Dave's format (month_reviews): health graded
                        first, business, next month's moves. EO scores live under /life/eo
  health/               Fitness: Whoop recovery, sleep, strain, HRV, resting HR, weight
  health/medical/       Bloodwork across panels and the medical record with documents
  review/[period]/      Monthly review
  area/[slug]/          Area page (metrics, records, goals, sources); body → health,
                        direction → goals, places → travel
  timeline/
  travel/               Current while a trip is underway, else upcoming; past, map
  travel/[id]/
  inbox/                review_queue
  sources/
  ask/
  login/
src/app/api/life/
  ingest/route.ts       Gmail + generic items (bearer secret)
  ingest/health/route.ts
  cron/notion/route.ts  (CRON_SECRET)
  cron/review/route.ts
  ask/route.ts
src/lib/life/           supabase clients, auth, extract/, trips.ts, review.ts, metrics.ts
apps-script/life-gmail.gs
scripts/life/notion-import.ts
supabase/life/migrations/
```

Supabase migrations live in `supabase/life/` so they never mix with the leads project.

### The focus ladder

The app answers one question, "Am I living the life I intend to live?", on one ladder: today, this week, this month, this year, five years. Health is the foundation under it. Where each rung comes from:

| Rung | Source | Parser |
|---|---|---|
| Today | Today's own journal entry, `# ❶ The One Thing` → `**Today**: …` (business) and `**Health**: …` (health, `fields.one_thing_health`); an empty rung takes it inline (`setOneThing` with a track) | `src/lib/life/focus-parse.ts` `parseOneThing` |
| Week, month | Latest journal entry with a `# ❸ {Month}` block: numbered goals, `**Week N:**` lines, `**Deals that should close**`, `**{Month} Moves**`; ✅ ❌ 🟡 marks become statuses | `parseMonthBlock` |
| Track record | The `Historical` reference entry (template block), one `###` section per month | `parseHistory` |
| This week, this month | `goals` rows with `horizon` `week` / `month`, `focus` and `track`, set inline on the ladder (`setFocusGoal`, one per period per track); the journal's ❸ block only counts for the month it was written in |
| Year | `goals` rows with `horizon` `year`, managed on `/life/goals` and editable on the ladder |
| Five years | The vision as prose: one `entries` row (`kind=reference`, title `Five-year vision`) with `fields` `{statement, values[], picture}` (`src/lib/life/vision.ts`, `saveVision`), edited in place on the ladder; the vision goals stay as cards on `/life/goals` | `src/lib/life/focus.ts` `getLongGoals` |

Month and week goals are never edited in the app yet: Dave writes them in Notion and the nightly sync carries them in.

### The journal in the app

A day written on `/life/journal/[date]` is an `entries` row (`kind=journal`) with `fields` `{one_thing, gratitude, nhb}` and `body_md` rendered from them in the Notion template's shape (migration `20261103000000_journal_todos.sql`), so the ladder's parser, search and Ask read app-written and Notion-written days alike. The day's weight goes to `measurements`. To-dos are `todos` rows: open from `added_on` until `done_on` or `dropped_on`, one level of nesting, so any day shows what was open then and what got done that day. The open list is draggable (`TodoList.tsx`, `reorderTodos`): `sort_order` is the order, and items above the line carry `planned_on` = that day (an item planned for an earlier day stays above the line until done or moved; the up arrow on a later item moves it just above the line). The Notion sync keeps running; where a day exists in both, the app-written row wins on the page, and a Notion day prefills the form so it can be edited. The sync also carries the journal's to-do lists into `todos` (`src/lib/life/todos-sync.ts`, nightly in the Notion cron, `scripts/life/sync-todos.ts` by hand): the dated DONE groups of every synced entry become done items (history), and the newest Notion page, fetched whole because synced entries keep only each day's new lines, says what is open now. Items added in the app (`source = app`) are never touched.

Trip purpose is business (default), eo or personal (holiday). The first pass set eo where a journal entry written during the trip mentions EO, a forum, Ignite, GLC, RLA or Nerve. The first vision and year rows were seeded from journal passages (the One Thing, the "Dealing with Age" forum presentation, the October 2026 EO update) and are meant to be rewritten in the app.

Health reads the `whoop_*` metrics plus `weight_kg` (`src/lib/life/health.ts`). Whoop zones: recovery 67% and up is green, 34 to 66% yellow, under 34% red.

### Bloodwork

A lab panel is four things: every analyte as a `lab_results` row (numeric or text result, unit, reference range, flag; migration `20261102120000_lab_results.sql`), the PDF in the private bucket (`documents` row, opened through `/api/life/documents/[id]`, which mints a five-minute signed URL after the owner check), a Body `records` row (`kind=lab`, linked `attached` to the document) and one `measurements` row per tracked marker. Markers are `metrics` on the `lab` source with `ref_low` / `ref_high` / `ref_note` for the reference range (migration `20261102110000_metric_ranges.sql`), so `src/lib/life/labs.ts` can read every value as in or out of range. The full analyte list goes in `documents.text` for Ask. Tracked today: HbA1c, fasting glucose, LDL, total cholesterol, triglycerides, HDL, hs-CRP, eGFR, vitamin D. A new panel is a JSON transcription of the report run through `scripts/life/import-lab.ts` (see its header for the shape); it writes all four and is idempotent on date and analyte. Transcriptions stay outside the repo (`context/Heath Data/`).

Settings › Accounts (`/life/settings/accounts`) is an inventory of online accounts in `logins` (migration `20261108000000_logins_addresses.sql`; `accounts` was already taken by money accounts): name, who it belongs to, category, login, status (active, rotate, close, closed), 2FA, card last four and expiry, member number, and `vault_ref`, the password-manager item that holds the secret. It never holds a password, PIN, card or account number, key or recovery code, and the save action turns away long digit runs in free text. Settings › Addresses (`/life/settings/addresses`) is `addresses`: own, family and company addresses. Neither table is granted to `life_reader`, so Ask cannot read them. The repo is public, so their rows were seeded straight into the database, never into a migration.

## PR slices (Phase 1)

Each slice is a branch and PR into `main`. Gate = what must be true to merge.

| # | Slice | Gate |
|---|---|---|
| 1 | Create `dave-life` project; base migration with every table above, RLS, column comments, `life_reader`; seed `areas`, Phase 1 `metrics`, `sources`; env vars in Vercel | `get_advisors` security returns no issues; publishable key with no session reads zero rows from every table; `life_reader` cannot insert |
| 2 | Auth: `proxy.ts` gate, `requireOwner()` in layout and every route/action, email link login, `noindex`, sitemap/robots exclusion | Logged out: every `/life` page redirects, every `/api/life` route (except ingest with valid secret) returns 401. A second Google account is refused |
| 3 | Ingest plumbing: `/api/life/ingest`, `source_items`, `workflow_runs`, Sources page, Inbox page with approve/reject | Replaying the same item is a no-op; bad secret returns 401; an injected test item shows in Inbox and resolves |
| 4 | W2 Notion import + nightly cron | 579 journal + 65 EO pages imported; rerun creates zero rows; 5 sampled daily entries contain only that day's text; 76s, 2028 and date mismatches are in Inbox; an edit in Notion appears next morning |
| 5 | Home, area pages, timeline, search | Every Phase 1 metric charts on its area page; a term from a 2021 entry is found by search; timeline renders 2021 to now |
| 6 | W4 Health sync + full-history backfill | 14 consecutive days of measurements; re-sent day overwrites rather than duplicates |
| 7 | W3 travel extraction + W5 trip builder, with fixtures | Fixture suite passes (confirmation, change, cancellation, multi-leg, two-hotel conflict); replay is a no-op |
| 8 | W1 Apps Script live + backfill to 2006 | Every trip in the TripIt feed exists with matching dates and flights; backfill cursor reaches 2006-01; a new booking appears within an hour |
| 9 | Travel views (upcoming, past, map, trip page) | Phnom Penh conflicts are in Inbox, not in the itinerary; usable at 375px |
| 10 | W6 monthly review draft + review page + goals + "Copy as EO update" | Running the cron for 2026-10 produces a draft with every Phase 1 area filled; finishing takes under 15 minutes |
| 11 | W10 Ask | Answers, with sources: "When was my spinal fusion?", "How many times have I been to Australia?", "What word described October 2024?"; a write attempt fails |
| 12 | Phase 1 records: hand-seed life events from the EO Lifeline, attach surgery documents | ACL tear, back surgery and spinal fusion exist as `records` with best-known dates; documents open only via signed URL |

Order: 1 → 2 → 3, then 4, 6 and 7 in parallel, then 5, 8, 9, 10, 11, 12.

## Definition of Done (Phase 1)

Copied from the brief; all true on production and checked by Dave.

1. **Locked down.** Logged out, every `/life` page redirects and every `/api/life` route returns 401. A second account cannot sign in. The publishable key reads zero rows. Security advisor clean.
2. **Notion is in.** 579 journal entries and 65 EO updates imported, journal entries hold only that day's writing, reruns create zero duplicates, Notion edits arrive by next morning.
3. **Five years of reviews.** Every EO update since 2021 is a monthly review with scores and one word; anomalies were resolved through Inbox.
4. **Body flows.** Apple Health data arrived every day for 14 consecutive days; weight, workouts and sleep chart on the Body page.
5. **Travel is complete.** Backfill reached 2006; every TripIt-feed trip exists with matching dates and flights; new bookings appear within an hour; cancellations remove legs.
6. **The review writes itself.** On December 1 the November draft is waiting with every Phase 1 area filled; finishing takes under 15 minutes.
7. **Questions get answered.** Ask answers the three gate questions with sources and cannot write.
8. **Sources are visible.** Every Phase 1 source shows its last run; a failed run shows as a warning within a day.
9. **Works on a phone.** Home, review, travel and Ask usable at 375px.
10. **Shipped properly.** `tsc --noEmit` and `next build` pass; every slice merged through a reviewed PR; deployed by git push.

## Phase 2 and 3 outline

- **Phase 2:** People (Contacts vCard, Calendar attendees → `interactions`, LinkedIn export, contact intervals, W8 nudges), Money (W7 statements → `accounts` / `balances`, net worth view), Work (LinkedIn/CV → `records` kind `job`/`company`), Admin (Drive scans → `documents` + `obligations`, renewal emails via W1). Migration adds nothing; tables exist from slice 1.
- **Phase 3:** Legacy (W9 Photos Picker, Forever export, family history records), Time (calendar hours by area as `measurements`), Mind (Readwise, courses), Places (Maps Timeline). Adds `media` usage and photo views.

Each phase gets its own slice table and DoD in this file before work starts.

## Open decisions

| Question | Default if not decided |
|---|---|
| Wearable beyond Apple Health | Apple Health only in Phase 1 |
| Monthly review replaces or feeds the Notion EO template | Feeds it ("Copy as EO update") |
| Trips before 2006 | Manual records only |
| Nudge and review delivery | Email to `LIFE_OWNER_EMAIL` |
