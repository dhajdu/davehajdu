// Server-only. Hand-maintained schema summary for the Ask assistant, derived
// from supabase/life/migrations/20261101000000_life_base.sql (tables, columns,
// `comment on` text). When a migration changes a table Ask should know about,
// update the lines here. Every table also has id uuid, created_at, updated_at;
// owner-scoped tables have owner_id (RLS already limits rows to the owner, so
// never filter on owner_id or call auth.uid()).

export const LIFE_SCHEMA = `
## Database (PostgreSQL, schema "public")

This is Dave Hajdu's private life database. One owner. Home is Saigon, Vietnam
(airport SGN, timezone Asia/Ho_Chi_Minh, UTC+7) since 2006. Unqualified table
names resolve to public. Only public is readable.

### Frame (shared config)
- areas: slug, name, sort_order, description. The ten areas of a life; every
  record, metric, entry and goal belongs to one. Slugs: body, mind, people,
  money, work, places, time, direction, admin, legacy.
- metrics: area_id -> areas, slug, name, unit, aggregation (avg|sum|last: how
  daily values roll up to a month), direction (higher_better|lower_better|target),
  source_id -> sources. Slugs: weight_kg, body_fat_pct, steps, workouts,
  active_kcal, sleep_hours, resting_hr, hrv_ms (body); journal_entries (mind);
  nights_away, trips (places).
- sources: slug (gmail|notion|apple_health|tripit|manual), name, method, cadence,
  enabled, last_run_at, last_status. Connector registry.

### What happened
- records: area_id, kind (surgery|job|company|move|milestone|family|...), title,
  started_on date, ended_on date, date_precision (day|month|year|approx),
  place_id -> places, notes, source_item_id. Things that happened: surgeries,
  jobs, moves, milestones. The timeline. Respect date_precision: a 'year'
  precision date of 2015-01-01 means "sometime in 2015".
- measurements: metric_id -> metrics, measured_on date, value numeric. One value
  per metric per day. Monthly roll-up uses metrics.aggregation.
- entries: area_id, kind (journal|eo_update|learning|presentation|reference|note),
  entry_date date, title, body_md, external_id (Notion page id), notion_tags
  text[], search tsvector (generated from title + body_md, GIN indexed).
  Reflections: journal entries, EO updates, forum learnings, presentations.
  Full-text: where search @@ websearch_to_tsquery('english', 'spinal fusion').
  body_md can be long: select left(body_md, 500) unless you need all of it.
  'reference' entries are template boilerplate, usually exclude them.

### Direction
- reviews: period text 'YYYY-MM' (unique), one_word, headline, status
  (draft|done), auto_summary jsonb, entry_id -> entries (source EO update).
  Monthly life review; imported EO updates become reviews. "What word described
  October 2024" = reviews.one_word where period = '2024-10'.
- review_scores: review_id -> reviews, area_id -> areas, score numeric 0 to 10,
  feelings, headline, impact. EO score mapping: Physical = body, Mental = mind,
  Financial = money, Friends/Family = people, Professional = work.
- goals: area_id, title, horizon (30d|60d|year|vision), metric_id, target_value,
  due_on, status (open|hit|missed|dropped), review_id (the review it was set in).

### Places and travel
- places: name, city, country, lat, lng, kind (home|hotel|airport|venue|city),
  iata (airport code when kind = airport, e.g. SGN).
- trips: title, title_locked, start_on date, end_on date, primary_place_id ->
  places, purpose (business|personal|unknown), notes. A trip runs from leaving
  Saigon (SGN) to returning, built from trip_legs.
- trip_legs: trip_id -> trips, kind (flight|hotel|train|car|event), status
  (confirmed|changed|cancelled), confirmation_code, provider, number,
  origin_place_id -> places, destination_place_id -> places, starts_at
  timestamptz, start_tz, ends_at timestamptz, end_tz, address, raw jsonb.
  Times are stored in UTC with the local IANA timezone alongside: local start
  is (starts_at at time zone start_tz). Exclude status = 'cancelled' unless asked.

### People, money, files (may be sparse or empty)
- people: name, relationship, closeness 1 to 5, how_met, birthday, contact jsonb,
  contact_every_days, notes.
- interactions: person_id -> people, happened_at timestamptz, kind
  (meeting|call|trip|message), record_id -> records, notes.
- accounts: name, institution, kind (bank|card|brokerage|loan|property|crypto),
  currency, is_liability. balances: account_id, as_of date, balance,
  balance_usd, fx_rate.
- documents: title, doc_date, mime, text, storage_path. obligations: title,
  kind, expires_on, renews_on, document_id.
- media: taken_at, place_id, caption.
- tags (name, color) + taggables (tag_id, entity_type = table name, entity_id).
- links: from_type, from_id, to_type, to_id, relation (mentions|attached|during|with).
  Generic relations, e.g. trip --during--> journal entry.
- review_queue: pending extractions waiting for the owner (kind, proposed jsonb,
  confidence, reason, status pending|approved|rejected|edited).
- source_items: raw inbox (one row per email, Notion page, health day).
  workflow_runs: sync job log.

### Join hints
- Metric values: measurements m join metrics k on k.id = m.metric_id where
  k.slug = 'sleep_hours'. Monthly: date_trunc('month', m.measured_on).
- Review scores by area: reviews r join review_scores s on s.review_id = r.id
  join areas a on a.id = s.area_id.
- Where a trip went: trips t join trip_legs l on l.trip_id = t.id join places p
  on p.id = l.destination_place_id (also t.primary_place_id -> places).
  "Times in Australia" = count(distinct t.id) of trips with a leg whose
  destination place has country 'Australia' (check how country is spelled first).
- Journal entries during a trip: links where from_type = 'trips' and
  from_id = t.id and relation = 'during' and to_type = 'entries', join entries
  e on e.id = links.to_id. Or e.entry_date between t.start_on and t.end_on.
- Records and entries by area: join areas a on a.id = x.area_id.
`.trim();
