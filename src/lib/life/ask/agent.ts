import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { getOwnerContext } from '../auth';
import { LIFE_SCHEMA } from './schema';

// Ask: a Claude tool-use loop over the owner's own data. Read-only by
// construction: every query goes through public.life_ask_query (runs as the
// SELECT-only role life_reader with RLS scoped to the caller, 8s timeout, 200
// rows), called with the owner's SESSION client. validateSql below is a second,
// app-side gate so obviously bad SQL never reaches the database.

type LifeClient = NonNullable<Awaited<ReturnType<typeof getOwnerContext>>>['supabase'];
type MessageParam = Anthropic.Beta.Messages.BetaMessageParam;
type ToolResult = Anthropic.Beta.Messages.BetaToolResultBlockParam;

const MODEL = 'claude-sonnet-5-5';
const MAX_QUERIES = 8;
const MAX_TURNS = 12;
const MAX_QUERY_CHARS = 8000;
const MAX_RESULT_CHARS = 40000;
const ROW_CAP = 200;
const MAX_SOURCES = 12;

const AREA_SLUGS = ['body', 'mind', 'people', 'money', 'work', 'places', 'time', 'direction', 'admin', 'legacy'];
const SOURCE_TABLES = ['trips', 'reviews', 'entries', 'records', 'metrics', 'measurements', 'goals', 'places', 'people'] as const;
type SourceTable = (typeof SOURCE_TABLES)[number];

export type AskTurn = { role: 'user' | 'assistant'; content: string };
export type AskSource = { table: SourceTable; id: string; label: string; href: string };
export type AskResult = { answer: string; sources: AskSource[]; queries: number };

const QUERY_TOOL: Anthropic.Beta.Messages.BetaTool = {
  name: 'query_life',
  description:
    'Run one read-only SQL SELECT (or WITH) against the life database and get the rows back as JSON. ' +
    'Use it for every factual question. Results are capped at 200 rows: aggregate in SQL for counts, ' +
    'sums and averages, and add ORDER BY and LIMIT for listings. Always select the id column of the ' +
    'rows you may cite. You can introspect with information_schema.columns where table_schema = \'public\'.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      sql: { type: 'string', description: 'One SELECT or WITH statement. No semicolons.' },
      purpose: { type: 'string', description: 'One short line on what this query is for.' },
    },
    required: ['sql', 'purpose'],
  },
};

const ANSWER_TOOL: Anthropic.Beta.Messages.BetaTool = {
  name: 'answer',
  description:
    'Give the final answer to the owner. Call this exactly once, on its own, when you are done querying. ' +
    'sources lists the rows the answer relies on, taken from query results (never invented).',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      answer: { type: 'string', description: 'The answer in plain prose or short "-" bullets.' },
      sources: {
        type: 'array',
        description: 'Rows cited. Empty if the data was missing.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            table: { type: 'string', enum: [...SOURCE_TABLES] },
            id: { type: 'string', description: 'The row id (uuid) exactly as returned by a query.' },
            label: { type: 'string', description: 'Short human label, e.g. "Spinal fusion, Mar 2019" or "Sydney, Nov 2023".' },
            key: {
              type: 'string',
              description:
                'For reviews: the period (YYYY-MM). For metrics, measurements and goals: the area slug. Otherwise "".',
            },
          },
          required: ['table', 'id', 'label', 'key'],
        },
      },
    },
    required: ['answer', 'sources'],
  },
};

const SYSTEM_STABLE = `
You are Ask, the assistant inside Dave Hajdu's private /life database. You
answer Dave's questions about his own life (health, travel, reviews, journal,
records) by querying his data with the query_life tool, then you finish by
calling the answer tool.

${LIFE_SCHEMA}

## How you work
- Every fact comes from a query_life result. Never invent dates, counts, places
  or values, and never fill gaps from general knowledge.
- If the data is not there, say so plainly, e.g. "The exact date isn't logged
  yet." or "No sleep data before 2023." Partial answers are fine; label them.
- You have at most ${MAX_QUERIES} queries per question. Plan: look up values
  first (e.g. how a country is spelled), then answer. Prefer one focused query
  per call, and aggregate in SQL.
- If a query errors, read the error, fix the SQL and retry. "permission denied"
  means the object is out of scope: do not work around it.
- Never filter on owner_id and never call auth.uid(): row security already
  limits every table to Dave's rows.
- Dates: today's date is given below. Local day boundaries are Asia/Ho_Chi_Minh
  unless a trip leg's own timezone applies.
- For correlations (e.g. sleep vs travel), compute per-month values in SQL,
  report the numbers and how many months had data, and do not overstate cause.
- Finish by calling answer once, on its own. Cite the specific rows you used
  (select their id in your queries). For aggregates, cite the few most
  representative rows (e.g. the trips counted, or the metric) rather than none.

## Style
- Lead with the answer in one or two sentences, then detail only if useful.
- Plain prose or "-" bullets. No tables, no emojis, no em dashes.
- Talk to Dave as "you".
`.trim();

// ---------- SQL gate ----------

const BLOCKED_SCHEMA =
  /\b(?:auth|storage|vault|cron|net|extensions|realtime|graphql|graphql_public|supabase_migrations|supabase_functions|pgsodium)\s*\.\s*"?[a-z_]/i;
const BLOCKED_KEYWORDS =
  /\b(?:insert|update|delete|merge|truncate|drop|alter|create|grant|revoke|copy|call|do|set|reset|vacuum|analyze|lock|listen|notify|execute|prepare)\b/i;
const BLOCKED_FUNCS = /\b(?:set_config|pg_sleep\w*|dblink\w*|lo_\w+|pg_read\w*|pg_ls_\w+|pg_terminate_backend|pg_cancel_backend|life_ask_query)\s*\(/i;

export function validateSql(input: string): { ok: true; sql: string } | { ok: false; error: string } {
  let q = (input ?? '').trim();
  if (q.endsWith(';')) q = q.slice(0, -1).trimEnd();
  if (!q) return { ok: false, error: 'Empty query.' };
  if (q.length > MAX_QUERY_CHARS) return { ok: false, error: `Query too long (max ${MAX_QUERY_CHARS} characters).` };
  if (!/^(select|with)\s/i.test(q)) return { ok: false, error: 'Only a single SELECT or WITH query is allowed.' };
  // Check keywords outside string literals and comments, so ilike '%update%' still works.
  const code = q.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  if (code.includes(';')) return { ok: false, error: 'Only one statement is allowed (no semicolons).' };
  if (BLOCKED_SCHEMA.test(code)) return { ok: false, error: 'Only the public schema is readable.' };
  if (BLOCKED_FUNCS.test(code)) return { ok: false, error: 'That function is not allowed.' };
  const kw = code.match(BLOCKED_KEYWORDS);
  if (kw) return { ok: false, error: `"${kw[0]}" is not allowed: Ask is read-only.` };
  return { ok: true, sql: q };
}

// ---------- tool execution ----------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function collectIds(value: unknown, into: Set<string>) {
  if (typeof value === 'string') {
    if (UUID.test(value)) into.add(value.toLowerCase());
  } else if (Array.isArray(value)) {
    for (const v of value) collectIds(v, into);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectIds(v, into);
  }
}

async function runQuery(supabase: LifeClient, sql: string, seenIds: Set<string>): Promise<{ content: string; isError: boolean }> {
  const v = validateSql(sql);
  if (!v.ok) return { content: v.error, isError: true };
  const { data, error } = await supabase.rpc('life_ask_query', { q: v.sql });
  if (error) return { content: error.message || 'Query failed.', isError: true };
  const rows = Array.isArray(data) ? data : [];
  collectIds(rows, seenIds);
  let json = JSON.stringify(rows);
  let note = rows.length >= ROW_CAP ? ` Result hit the ${ROW_CAP}-row cap and may be truncated; aggregate or narrow it.` : '';
  if (json.length > MAX_RESULT_CHARS) {
    json = json.slice(0, MAX_RESULT_CHARS);
    note += ' Output was cut off for length; select fewer or shorter columns (e.g. left(body_md, 300)).';
  }
  return { content: `${rows.length} row(s).${note}\n${json}`, isError: false };
}

// ---------- sources ----------

function hrefFor(table: SourceTable, id: string, label: string, key: string): string | null {
  const q = `/life/timeline?q=${encodeURIComponent(label)}`;
  switch (table) {
    case 'trips':
      return `/life/travel/${id}`;
    case 'reviews':
      return /^\d{4}-\d{2}$/.test(key) ? `/life/review/${key}` : null;
    case 'metrics':
    case 'measurements':
    case 'goals':
      return AREA_SLUGS.includes(key) ? `/life/area/${key}` : table === 'goals' ? q : null;
    default:
      return q;
  }
}

type RawSource = { table?: unknown; id?: unknown; label?: unknown; key?: unknown };

function cleanSources(raw: unknown, seenIds: Set<string>): AskSource[] {
  if (!Array.isArray(raw)) return [];
  const out: AskSource[] = [];
  const dedupe = new Set<string>();
  for (const s of raw as RawSource[]) {
    const table = String(s?.table ?? '') as SourceTable;
    const id = String(s?.id ?? '').toLowerCase();
    const label = String(s?.label ?? '').trim().slice(0, 80) || table;
    const key = String(s?.key ?? '').trim();
    // Only rows that actually came back from a query this turn.
    if (!SOURCE_TABLES.includes(table) || !seenIds.has(id)) continue;
    const href = hrefFor(table, id, label, key);
    if (!href || dedupe.has(`${table}:${id}`)) continue;
    dedupe.add(`${table}:${id}`);
    out.push({ table, id, label, href });
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

// ---------- the loop ----------

export function askConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function runAsk(opts: { supabase: LifeClient; question: string; history?: AskTurn[] }): Promise<AskResult> {
  const client = new Anthropic({ maxRetries: 1, timeout: 90_000 });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

  const messages: MessageParam[] = [];
  for (const t of (opts.history ?? []).slice(-10)) {
    // History must start with a user turn and alternate; skip anything else.
    const last = messages[messages.length - 1];
    if (!messages.length && t.role !== 'user') continue;
    if (last && last.role === t.role) continue;
    messages.push({ role: t.role, content: t.content.slice(0, 4000) });
  }
  if (messages.length && messages[messages.length - 1].role === 'user') messages.pop();
  messages.push({ role: 'user', content: opts.question });

  const seenIds = new Set<string>();
  let queries = 0;
  let lastText = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: [
        { type: 'text', text: SYSTEM_STABLE, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Today is ${today}.` },
      ],
      tools: [QUERY_TOOL, ANSWER_TOOL],
      tool_choice: { type: 'auto' },
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return { answer: "I can't answer that one.", sources: [], queries };
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (text) lastText = text;

    const toolUses = response.content.filter(
      (b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === 'tool_use',
    );

    const answerCall = toolUses.find((b) => b.name === ANSWER_TOOL.name);
    if (answerCall) {
      const input = answerCall.input as { answer?: unknown; sources?: unknown };
      const answer = typeof input.answer === 'string' && input.answer.trim() ? input.answer.trim() : lastText;
      return { answer: answer || 'I could not find an answer in your data.', sources: cleanSources(input.sources, seenIds), queries };
    }

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      // Model answered in plain text without the answer tool: no reliable sources.
      return { answer: lastText || 'I could not find an answer in your data.', sources: [], queries };
    }

    messages.push({ role: 'assistant', content: response.content });

    const results: ToolResult[] = await Promise.all(
      toolUses.map(async (b): Promise<ToolResult> => {
        if (b.name !== QUERY_TOOL.name) {
          return { type: 'tool_result', tool_use_id: b.id, content: `Unknown tool ${b.name}.`, is_error: true };
        }
        if (queries >= MAX_QUERIES) {
          return {
            type: 'tool_result',
            tool_use_id: b.id,
            content: `Query limit (${MAX_QUERIES}) reached. Call answer now with what you have, and say what is missing.`,
            is_error: true,
          };
        }
        queries++;
        const input = b.input as { sql?: unknown };
        const r = await runQuery(opts.supabase, typeof input.sql === 'string' ? input.sql : '', seenIds);
        return { type: 'tool_result', tool_use_id: b.id, content: r.content, is_error: r.isError || undefined };
      }),
    );
    messages.push({ role: 'user', content: results });
  }

  return { answer: lastText || 'That took too many steps. Try a narrower question.', sources: [], queries };
}
