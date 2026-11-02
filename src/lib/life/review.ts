import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { getOwnerId, lifeAdmin, startRun } from './supabase-admin';
import {
  countEntriesByMonth,
  currentPeriod,
  getAreas,
  getMetricSummaries,
  getMetrics,
  goalHit,
  ictToday,
  metricValueForMonth,
  nightsInRange,
  periodEnd,
  periodLabel,
  periodStart,
  shiftPeriod,
  summarizeCounts,
  tripsOverlapping,
  type CountSummary,
  type MetricDef,
} from './metrics';

// ===== Shapes =====

export type AutoSummaryMetric = {
  slug: string;
  name: string;
  area: string;
  unit: string | null;
  aggregation: string;
  direction: string;
  value: number | null;
  prev: number | null;
  avg12: number | null;
};

export type AutoSummary = {
  generated_at?: string;
  period?: string;
  metrics?: AutoSummaryMetric[];
  journal?: CountSummary;
  places?: { trips: { id: string; title: string; start_on: string; end_on: string | null }[]; nights_away: number };
  records?: { area: string; title: string; kind: string; started_on: string | null }[];
  goals_checked?: { id: string; title: string; status: 'hit' | 'missed'; value: number; target: number }[];
};

// ===== EO update =====
// The review is Dave's monthly forum update, in the format he already writes:
// MERPS (one word each), struggle, success, then four written updates.

export const EO_MERPS = [
  ['mental', 'Mental'],
  ['emotional', 'Emotional'],
  ['relationship', 'Relationship'],
  ['physical', 'Physical'],
  ['spiritual', 'Spiritual'],
] as const;
export const EO_SECTIONS = [
  ['business', 'Business'],
  ['family', 'Family & Friends'],
  ['personal', 'Personal'],
  ['community', 'Community'],
] as const;

export type EoMerp = (typeof EO_MERPS)[number][0];
export type EoSectionKey = (typeof EO_SECTIONS)[number][0];
export type EoSection = { feelings: string; headline: string; impact: string };
export const GOAL_STATUSES = ['green', 'yellow', 'red'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type EoUpdate = {
  merps?: Partial<Record<EoMerp, string>>;
  struggle?: string;
  success?: string;
  updates?: Partial<Record<EoSectionKey, EoSection>>;
  last_goals?: { title: string; status: GoalStatus | '' }[]; // last month's 30 day goals, rated
  next_goals?: { personal?: string; business?: string }; // one of each for the next 30 days
  drafted_at?: string;
  edited_at?: string;
};

// ===== Period helpers (Asia/Ho_Chi_Minh) =====

export function previousPeriodICT(now = new Date()): string {
  return shiftPeriod(currentPeriod(now), -1);
}

export function isFirstOfMonthICT(now = new Date()): boolean {
  return ictToday(now).endsWith('-01');
}

// ===== EO markdown =====

export function renderEoMarkdown(eo: EoUpdate): string {
  const lines: string[] = ['### Merps', ''];
  for (const [key, label] of EO_MERPS) lines.push(`${label}: ${eo.merps?.[key] ?? ''}`.trimEnd());
  lines.push('', `Struggle: ${eo.struggle ?? ''}`.trimEnd(), '', `Success: ${eo.success ?? ''}`.trimEnd(), '', '## Updates', '');
  for (const [key, label] of EO_SECTIONS) {
    const u = eo.updates?.[key];
    lines.push(`**${label}**`, '', `**Feelings:** ${u?.feelings ?? ''}`.trimEnd(), '', `**Headline:** ${u?.headline ?? ''}`.trimEnd(), '', '**Impact:**', '');
    if (u?.impact) lines.push(u.impact, '');
  }
  const dot = { green: '🟢', yellow: '🟡', red: '🔴', '': '⚪' } as const;
  lines.push('## Last 30 day goals', '');
  lines.push(...(eo.last_goals?.length ? eo.last_goals.map((g) => `- ${dot[g.status]} ${g.title}`) : ['-']), '');
  lines.push('## Next 30 day goals', '');
  lines.push(`- Personal: ${eo.next_goals?.personal ?? ''}`.trimEnd(), `- Business: ${eo.next_goals?.business ?? ''}`.trimEnd(), '');
  return lines.join('\n').trimEnd() + '\n';
}

// ===== Claude EO draft =====

const sectionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['feelings', 'headline', 'impact'],
  properties: { feelings: { type: 'string' }, headline: { type: 'string' }, impact: { type: 'string' } },
};

async function draftEo(period: string, material: string, examples: string[], lastGoals: string[]): Promise<EoUpdate | null> {
  if (!process.env.ANTHROPIC_API_KEY || !material.trim()) return null;
  const client = new Anthropic();

  const response = await client.beta.messages.create({
    model: 'claude-sonnet-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['merps', 'struggle', 'success', 'updates', 'last_goals', 'next_goals'],
          properties: {
            merps: {
              type: 'object',
              additionalProperties: false,
              required: EO_MERPS.map(([k]) => k),
              properties: Object.fromEntries(EO_MERPS.map(([k]) => [k, { type: 'string' }])),
            },
            struggle: { type: 'string' },
            success: { type: 'string' },
            updates: {
              type: 'object',
              additionalProperties: false,
              required: EO_SECTIONS.map(([k]) => k),
              properties: Object.fromEntries(EO_SECTIONS.map(([k]) => [k, sectionSchema])),
            },
            last_goals: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'status'],
                properties: { title: { type: 'string' }, status: { type: 'string', enum: [...GOAL_STATUSES] } },
              },
            },
            next_goals: {
              type: 'object',
              additionalProperties: false,
              required: ['personal', 'business'],
              properties: { personal: { type: 'string' }, business: { type: 'string' } },
            },
          },
        },
      },
    },
    system:
      'You draft the monthly EO forum update for its one author, Dave, from his own data for the month. ' +
      'Write in his voice, first person, matching the examples of his past updates: plain, honest, specific. ' +
      'MERPS: one word each for mental, emotional, relationship, physical and spiritual state. ' +
      'Struggle and success: one short line each. ' +
      'Four updates (business, family = family and friends, personal = health and habits, community = EO and wider community): ' +
      'feelings is two to four comma-separated feeling words; headline is one sentence; impact is one or two short paragraphs on why it matters. ' +
      'Last 30 day goals: rate each of last month\'s goals green (done), yellow (partly) or red (missed) from the evidence in the material; ' +
      'if you cannot tell, use yellow. Keep the goal wording as given. If no goals are given, use the 30 day goals in the most recent past update, or return an empty list. ' +
      'Next 30 day goals: exactly one personal goal and one business goal, each short and concrete, following from this month, in his words. ' +
      'Use only facts in the material. Never invent numbers, names or events. ' +
      'If the material says nothing about a section, return empty strings for it rather than guessing. Do not use em dashes.',
    messages: [
      {
        role: 'user',
        content:
          `<past_updates>\n${examples.map((e) => `<update>\n${e}\n</update>`).join('\n')}\n</past_updates>\n\n` +
          (lastGoals.length ? `<last_month_goals>\n${lastGoals.map((g) => `- ${g}`).join('\n')}\n</last_month_goals>\n\n` : '') +
          `<month name="${periodLabel(period)}">\n${material}\n</month>\n\nDraft the update for ${periodLabel(period)}.`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') return null;
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  try {
    const parsed = JSON.parse(text) as Required<Pick<EoUpdate, 'merps' | 'struggle' | 'success' | 'updates' | 'last_goals' | 'next_goals'>>;
    return { ...parsed, drafted_at: new Date().toISOString() };
  } catch {
    return null;
  }
}

// The MERPS-to-community part of a past forum doc: the rest is the meeting template.
function eoExample(body: string): string | null {
  const start = body.search(/merps/i);
  if (start < 0) return null;
  return body.slice(start, start + 6000).trim();
}

// ===== Draft builder (W6) =====

export type DraftResult = {
  period: string;
  reviewId: string | null;
  action: 'inserted' | 'updated' | 'merged' | 'skipped_done';
  drafted: boolean;
  goalsChecked: number;
};

// `force` redrafts the EO update even if the owner already edited it.
export async function buildReviewDraft(period: string, opts: { force?: boolean } = {}): Promise<DraftResult> {
  const finish = await startRun('review');
  try {
    const result = await build(period, opts.force ?? false);
    await finish({ itemsIn: 1, itemsOut: result.action === 'skipped_done' ? 0 : 1 });
    return result;
  } catch (e) {
    await finish({ error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

async function build(period: string, force: boolean): Promise<DraftResult> {
  const db = lifeAdmin;
  const owner = await getOwnerId();
  const from = periodStart(period);
  const to = periodEnd(period);

  const [areas, metrics] = await Promise.all([getAreas(db), getMetrics(db)]);
  const areaSlug = new Map(areas.map((a) => [a.id, a.slug]));

  const [summaries, trips, journalCounts, entriesRes, recordsRes, pastRes, prevRes] = await Promise.all([
    getMetricSummaries(db, metrics, period),
    tripsOverlapping(db, from, to),
    countEntriesByMonth(db, 'journal', shiftPeriod(period, -12), period),
    db
      .from('entries')
      .select('area_id, kind, entry_date, title, body_md')
      .in('kind', ['journal', 'eo_update', 'learning', 'presentation', 'note'])
      .gte('entry_date', from)
      .lte('entry_date', to)
      .order('entry_date'),
    db.from('records').select('area_id, kind, title, started_on').gte('started_on', from).lte('started_on', to).order('started_on'),
    db.from('entries').select('body_md').eq('kind', 'eo_update').lt('entry_date', from).order('entry_date', { ascending: false }).limit(6),
    db.from('reviews').select('eo').eq('owner_id', owner).eq('period', shiftPeriod(period, -1)).maybeSingle(),
  ]);
  if (entriesRes.error) throw new Error(entriesRes.error.message);
  if (recordsRes.error) throw new Error(recordsRes.error.message);
  if (pastRes.error) throw new Error(pastRes.error.message);
  const prevNext = (prevRes.data?.eo as EoUpdate | undefined)?.next_goals;
  const lastGoals = [prevNext?.personal && `Personal: ${prevNext.personal}`, prevNext?.business && `Business: ${prevNext.business}`].filter(
    (g): g is string => !!g
  );

  const entries = (entriesRes.data ?? []) as { area_id: string | null; kind: string; entry_date: string; title: string | null; body_md: string }[];
  const records = (recordsRes.data ?? []) as { area_id: string; kind: string; title: string; started_on: string | null }[];
  const nightsAway = trips.reduce((n, t) => n + nightsInRange(t, from, to), 0);

  // Material for Claude: the month's numbers, trips, records and writing.
  const numbers = summaries
    .filter((s) => s.value !== null)
    .map((s) => `${s.metric.name}: ${Math.round(s.value! * 10) / 10}${s.metric.unit ? ` ${s.metric.unit}` : ''}${s.prev !== null ? ` (last month ${Math.round(s.prev * 10) / 10})` : ''}`);
  const material = [
    numbers.length ? `<numbers>\n${numbers.join('\n')}\n</numbers>` : '',
    trips.length ? `<trips>\n${trips.map((t) => `${t.start_on} to ${t.end_on ?? 'open'}: ${t.title} (${t.purpose})`).join('\n')}\n</trips>` : '',
    records.length ? `<records>\n${records.map((r) => `${r.started_on ?? ''} ${r.kind}: ${r.title}`).join('\n')}\n</records>` : '',
    ...entries.map((e) => `<${e.kind} date="${e.entry_date}" area="${(e.area_id && areaSlug.get(e.area_id)) || ''}">\n${e.title ?? ''}\n${e.body_md.slice(0, 4000)}\n</${e.kind}>`),
  ]
    .filter(Boolean)
    .join('\n\n');
  const examples = ((pastRes.data ?? []) as { body_md: string }[])
    .map((e) => eoExample(e.body_md))
    .filter((e): e is string => !!e)
    .slice(0, 3);

  const goalsChecked = await checkDueGoals(to, metrics);

  const autoSummary: AutoSummary = {
    generated_at: new Date().toISOString(),
    period,
    metrics: summaries.map((s) => ({
      slug: s.metric.slug,
      name: s.metric.name,
      area: areaSlug.get(s.metric.area_id) ?? '',
      unit: s.metric.unit,
      aggregation: s.metric.aggregation,
      direction: s.metric.direction,
      value: s.value,
      prev: s.prev,
      avg12: s.avg12,
    })),
    journal: summarizeCounts(journalCounts, period),
    places: { trips: trips.map(({ id, title, start_on, end_on }) => ({ id, title, start_on, end_on })), nights_away: nightsAway },
    records: records.map((r) => ({ area: areaSlug.get(r.area_id) ?? '', title: r.title, kind: r.kind, started_on: r.started_on })),
    goals_checked: goalsChecked,
  };

  const { data: existing, error: exErr } = await db
    .from('reviews')
    .select('id, status, entry_id, auto_summary, eo')
    .eq('owner_id', owner)
    .eq('period', period)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);

  const base = { period, reviewId: (existing?.id as string | undefined) ?? null, goalsChecked: goalsChecked.length };

  if (existing?.entry_id) {
    // Imported from an EO update: keep everything the owner wrote, merge numbers in.
    const merged = { ...((existing.auto_summary as object) ?? {}), ...autoSummary };
    const { error } = await db.from('reviews').update({ auto_summary: merged }).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return { ...base, drafted: false, action: 'merged' };
  }
  if (existing?.status === 'done' && !force) return { ...base, drafted: false, action: 'skipped_done' };

  // Never overwrite the owner's edits unless asked to.
  const edited = !!(existing?.eo as EoUpdate | undefined)?.edited_at;
  const eo = edited && !force ? null : await draftEo(period, material, examples, lastGoals);
  const patch = { auto_summary: autoSummary, ...(eo ? { eo } : {}) };

  if (!existing) {
    const { data, error } = await db
      .from('reviews')
      .insert({ owner_id: owner, period, status: 'draft', ...patch })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { ...base, reviewId: data.id, drafted: !!eo, action: 'inserted' };
  }
  const { error } = await db.from('reviews').update(patch).eq('id', existing.id);
  if (error) throw new Error(error.message);
  return { ...base, drafted: !!eo, action: 'updated' };
}

// Open goals due on or before `asOf` with a metric and target: hit or missed
// from the metric's value in the month the goal was due.
async function checkDueGoals(asOf: string, metrics: MetricDef[]) {
  const { data, error } = await lifeAdmin
    .from('goals')
    .select('id, title, metric_id, target_value, due_on')
    .eq('status', 'open')
    .lte('due_on', asOf)
    .not('metric_id', 'is', null)
    .not('target_value', 'is', null);
  if (error) throw new Error(error.message);

  const byId = new Map(metrics.map((m) => [m.id, m]));
  const out: NonNullable<AutoSummary['goals_checked']> = [];
  for (const g of (data ?? []) as { id: string; title: string; metric_id: string; target_value: number; due_on: string }[]) {
    const metric = byId.get(g.metric_id);
    if (!metric) continue;
    const value = await metricValueForMonth(lifeAdmin, metric, g.due_on.slice(0, 7));
    if (value === null) continue; // no data: leave open for the owner to decide
    const target = Number(g.target_value);
    const status = goalHit(metric.direction, value, target) ? 'hit' : 'missed';
    const { error: upErr } = await lifeAdmin.from('goals').update({ status }).eq('id', g.id).eq('status', 'open');
    if (upErr) throw new Error(upErr.message);
    out.push({ id: g.id, title: g.title, status, value, target });
  }
  return out;
}
