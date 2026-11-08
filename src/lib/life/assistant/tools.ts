import 'server-only';
import { lifeAdmin } from '@/lib/life/supabase-admin';
import { addDays, ictToday, weekStart } from '@/lib/life/metrics';

// Tools for the personal assistant (Grok over MCP). Every query runs through
// life_assistant_run as the life_assistant role, so Postgres limits it to the
// journal, to-dos, travel, goals, and weight / blood sugar (migration
// 20261108010000_life_assistant.sql). The SQL is fixed here; the model only
// supplies arguments, passed as the jsonb $1.

type Args = Record<string, unknown>;
type Schema = { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties: false };
export type Tool = { name: string; description: string; inputSchema: Schema; write?: boolean; run: (args: Args, owner: string) => Promise<unknown> };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function q(owner: string, sql: string, args: Args = {}): Promise<Record<string, unknown>[]> {
  const { data, error } = await lifeAdmin.rpc('life_assistant_run', { q: sql, args, owner });
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

function date(v: unknown, fallback: string): string {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v !== 'string' || !DATE.test(v)) throw new Error('Dates are YYYY-MM-DD');
  return v;
}

function num(v: unknown, name: string, min: number, max: number): number {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return n;
}

function schema(properties: Record<string, unknown> = {}, required: string[] = []): Schema {
  return { type: 'object', properties, required, additionalProperties: false };
}

const dateProp = (what: string) => ({ type: 'string', description: `${what} (YYYY-MM-DD, Vietnam time). Defaults to today.` });
const METRIC = { weight: 'weight_kg', blood_sugar: 'blood_sugar_mgdl' } as const;

const JOURNAL_DAY = `select entry_date, title, fields, body_md from entries
  where kind = 'journal' and entry_date = ($1->>'date')::date
  order by (fields is not null) desc, updated_at desc limit 1`;

const OPEN_TODOS = `select id, title, parent_id, added_on, planned_on, sort_order from todos
  where done_on is null and dropped_on is null order by sort_order, added_on`;

async function logMeasurement(owner: string, slug: string, day: string, value: number) {
  const rows = await q(
    owner,
    `insert into measurements (metric_id, measured_on, value)
     select id, ($1->>'date')::date, ($1->>'value')::numeric from metrics where slug = $1->>'slug'
     on conflict (owner_id, metric_id, measured_on) do update set value = excluded.value
     returning measured_on, value`,
    { slug, date: day, value }
  );
  if (!rows.length) throw new Error('Metric not found');
  return rows[0];
}

export const TOOLS: Tool[] = [
  {
    name: 'get_today',
    description: "Dave's day at a glance: today's One Thing (business and health) from the journal, this week's and this month's One Thing and goals, open to-dos planned for today, any trip in progress, and the latest weight and blood sugar.",
    inputSchema: schema(),
    async run(_args, owner) {
      const today = ictToday();
      const [day, goals, todos, trips, latest] = await Promise.all([
        q(owner, JOURNAL_DAY, { date: today }),
        q(owner, `select title, horizon, period, focus, track, status, due_on from goals
          where status = 'open' and ((horizon = 'week' and period = $1->>'week') or (horizon = 'month' and period = $1->>'month') or horizon in ('year','vision'))
          order by focus desc, horizon`, { week: weekStart(today), month: today.slice(0, 7) }),
        q(owner, `select id, title, planned_on from todos where done_on is null and dropped_on is null and parent_id is null and planned_on <= ($1->>'today')::date order by sort_order`, { today }),
        q(owner, `select id, title, start_on, end_on, purpose from trips where start_on <= ($1->>'today')::date and coalesce(end_on, start_on) >= ($1->>'today')::date`, { today }),
        q(owner, `select distinct on (m.slug) m.slug, x.measured_on, x.value, m.unit from measurements x join metrics m on m.id = x.metric_id order by m.slug, x.measured_on desc`),
      ]);
      const f = (day[0]?.fields ?? null) as { one_thing?: string; one_thing_health?: string } | null;
      return {
        today,
        one_thing: f?.one_thing || null,
        one_thing_health: f?.one_thing_health || null,
        journal_written: day.length > 0,
        goals,
        todos_today: todos,
        trip_in_progress: trips[0] ?? null,
        latest_measurements: latest,
      };
    },
  },
  {
    name: 'get_journal',
    description: "One journal day: the One Thing, gratitude, notes (NHB) and the full text. Journal only; other notes are not available.",
    inputSchema: schema({ date: dateProp('The day') }),
    async run(args, owner) {
      const rows = await q(owner, JOURNAL_DAY, { date: date(args.date, ictToday()) });
      return rows[0] ?? { message: 'No journal entry for that day.' };
    },
  },
  {
    name: 'search_journal',
    description: 'Full-text search across journal days. Returns matching days newest first with a short excerpt.',
    inputSchema: schema({ text: { type: 'string', description: 'Words to search for' }, limit: { type: 'integer', minimum: 1, maximum: 30 } }, ['text']),
    async run(args, owner) {
      const text = String(args.text ?? '').trim().slice(0, 200);
      if (!text) throw new Error('Give some words to search for');
      return q(
        owner,
        `select entry_date, title, left(body_md, 400) as excerpt from entries
         where kind = 'journal' and search @@ websearch_to_tsquery('english', $1->>'text')
         order by entry_date desc limit ($1->>'limit')::int`,
        { text, limit: Math.min(30, Math.max(1, Number(args.limit) || 10)) }
      );
    },
  },
  {
    name: 'list_todos',
    description: "The to-do list. 'open' (default) is everything not done or dropped, in Dave's order; items with planned_on today or earlier are on today's list. 'done' is what got done from a date onward.",
    inputSchema: schema({ status: { type: 'string', enum: ['open', 'done'] }, since: dateProp("For 'done': from this day. Defaults to 7 days ago;") }),
    async run(args, owner) {
      if (args.status === 'done') {
        const since = date(args.since, addDays(ictToday(), -7));
        return q(owner, `select id, title, parent_id, done_on from todos where done_on >= ($1->>'since')::date order by done_on desc`, { since });
      }
      return q(owner, OPEN_TODOS);
    },
  },
  {
    name: 'add_todo',
    description: "Adds a to-do to the end of today's list.",
    inputSchema: schema({ title: { type: 'string', description: 'What to do' } }, ['title']),
    write: true,
    async run(args, owner) {
      const title = String(args.title ?? '').trim().slice(0, 300);
      if (!title) throw new Error('Give the to-do a title');
      const today = ictToday();
      const rows = await q(
        owner,
        `insert into todos (title, added_on, planned_on, sort_order, source)
         select $1->>'title', ($1->>'today')::date, ($1->>'today')::date, coalesce(max(sort_order), 0) + 1, 'app' from todos
         returning id, title, planned_on`,
        { title, today }
      );
      return rows[0];
    },
  },
  {
    name: 'complete_todo',
    description: 'Marks a to-do done today, or not done again with done = false. Use the id from list_todos or get_today.',
    inputSchema: schema({ id: { type: 'string' }, done: { type: 'boolean' } }, ['id']),
    write: true,
    async run(args, owner) {
      const id = String(args.id ?? '');
      if (!UUID.test(id)) throw new Error('Unknown to-do id');
      const rows = await q(
        owner,
        `update todos set done_on = case when ($1->>'done')::boolean then ($1->>'today')::date end where id = ($1->>'id')::uuid returning id, title, done_on`,
        { id, done: args.done !== false, today: ictToday() }
      );
      if (!rows.length) throw new Error('No such to-do');
      return rows[0];
    },
  },
  {
    name: 'list_trips',
    description: 'Trips (each runs from leaving Saigon to coming home) overlapping a date range, with the main place. Defaults to the last 90 days and the next year.',
    inputSchema: schema({ from: dateProp('Start of range'), to: dateProp('End of range') }),
    async run(args, owner) {
      const today = ictToday();
      return q(
        owner,
        `select t.id, t.title, t.start_on, t.end_on, t.purpose, p.name as main_place, p.city, p.country
         from trips t left join places p on p.id = t.primary_place_id
         where t.start_on <= ($1->>'to')::date and coalesce(t.end_on, t.start_on) >= ($1->>'from')::date
         order by t.start_on`,
        { from: date(args.from, addDays(today, -90)), to: date(args.to, addDays(today, 365)) }
      );
    },
  },
  {
    name: 'get_trip',
    description: 'One trip with its flights and hotels in order. Times are UTC with the local time zone alongside.',
    inputSchema: schema({ id: { type: 'string', description: 'Trip id from list_trips' } }, ['id']),
    async run(args, owner) {
      const id = String(args.id ?? '');
      if (!UUID.test(id)) throw new Error('Unknown trip id');
      const [trip, legs] = await Promise.all([
        q(owner, `select id, title, start_on, end_on, purpose, notes from trips where id = ($1->>'id')::uuid`, { id }),
        q(
          owner,
          `select l.kind, l.status, l.number, l.confirmation_code, l.starts_at, l.start_tz, l.ends_at, l.end_tz, l.address,
                  o.name as origin, d.name as destination
           from trip_legs l left join places o on o.id = l.origin_place_id left join places d on d.id = l.destination_place_id
           where l.trip_id = ($1->>'id')::uuid order by l.starts_at`,
          { id }
        ),
      ]);
      if (!trip.length) throw new Error('No such trip');
      return { ...trip[0], legs };
    },
  },
  {
    name: 'list_goals',
    description: "Goals. horizon 'week' and 'month' hold the One Thing for that week (period = its Monday) or month (period = YYYY-MM); focus marks the One Thing. Defaults to open goals.",
    inputSchema: schema({
      horizon: { type: 'string', enum: ['week', 'month', 'year', 'vision', '30d', '60d'] },
      status: { type: 'string', enum: ['open', 'hit', 'missed', 'dropped', 'any'] },
    }),
    async run(args, owner) {
      return q(
        owner,
        `select title, horizon, period, focus, track, status, due_on, target_value from goals
         where ($1->>'horizon' is null or horizon = $1->>'horizon') and ($1->>'status' = 'any' or status = $1->>'status')
         order by horizon, period desc nulls last, focus desc limit 200`,
        { horizon: typeof args.horizon === 'string' ? args.horizon : null, status: typeof args.status === 'string' ? args.status : 'open' }
      );
    },
  },
  {
    name: 'get_measurements',
    description: 'Weight (kg) or blood sugar (mg/dL) readings, one per day, over a date range. Defaults to the last 30 days.',
    inputSchema: schema({ metric: { type: 'string', enum: ['weight', 'blood_sugar'] }, from: dateProp('Start'), to: dateProp('End') }, ['metric']),
    async run(args, owner) {
      const slug = METRIC[args.metric as keyof typeof METRIC];
      if (!slug) throw new Error("metric is 'weight' or 'blood_sugar'");
      const today = ictToday();
      return q(
        owner,
        `select x.measured_on, x.value, m.unit from measurements x join metrics m on m.id = x.metric_id
         where m.slug = $1->>'slug' and x.measured_on between ($1->>'from')::date and ($1->>'to')::date order by x.measured_on`,
        { slug, from: date(args.from, addDays(today, -30)), to: date(args.to, today) }
      );
    },
  },
  {
    name: 'log_weight',
    description: "Saves the day's weight in kg (one reading per day; a second one replaces the first). Convert pounds to kg first (1 lb = 0.4536 kg).",
    inputSchema: schema({ kg: { type: 'number', minimum: 30, maximum: 250 }, date: dateProp('The day') }, ['kg']),
    write: true,
    async run(args, owner) {
      return logMeasurement(owner, METRIC.weight, date(args.date, ictToday()), num(args.kg, 'Weight (kg)', 30, 250));
    },
  },
  {
    name: 'log_blood_sugar',
    description: "Saves the day's blood sugar in mg/dL (one reading per day; a second one replaces the first). Convert mmol/L to mg/dL first (x 18.016).",
    inputSchema: schema({ mg_dl: { type: 'number', minimum: 20, maximum: 600 }, date: dateProp('The day') }, ['mg_dl']),
    write: true,
    async run(args, owner) {
      return logMeasurement(owner, METRIC.blood_sugar, date(args.date, ictToday()), Math.round(num(args.mg_dl, 'Blood sugar (mg/dL)', 20, 600)));
    },
  },
];
