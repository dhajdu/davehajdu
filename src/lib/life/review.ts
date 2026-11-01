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
  highlights?: Record<string, string>;
  goals_checked?: { id: string; title: string; status: 'hit' | 'missed'; value: number; target: number }[];
};

// EO's five scores, mapped to areas.
export const EO_SCORES: [label: string, area: string][] = [
  ['Physical', 'body'],
  ['Mental', 'mind'],
  ['Financial', 'money'],
  ['Friends/Family', 'people'],
  ['Professional', 'work'],
];

// ===== Period helpers (Asia/Ho_Chi_Minh) =====

export function previousPeriodICT(now = new Date()): string {
  return shiftPeriod(currentPeriod(now), -1);
}

export function isFirstOfMonthICT(now = new Date()): boolean {
  return ictToday(now).endsWith('-01');
}

// ===== EO markdown =====

type ScoreInput = { score: number | null; feelings: string | null; headline: string | null; impact: string | null };

export function renderEoMarkdown(input: {
  period: string;
  oneWord: string | null;
  headline: string | null;
  scores: Record<string, ScoreInput | undefined>;
  goals: { title: string; horizon: string }[];
}): string {
  const lines: string[] = [`# EO update: ${periodLabel(input.period)}`, ''];
  if (input.oneWord) lines.push(`**One word:** ${input.oneWord}`);
  if (input.headline) lines.push(`**Headline:** ${input.headline}`);
  if (input.oneWord || input.headline) lines.push('');

  const section = (title: string, slugs: string[]) => {
    lines.push(`## ${title}`);
    let any = false;
    for (const slug of slugs) {
      const s = input.scores[slug];
      if (!s) continue;
      const prefix = slugs.length > 1 ? `${slug[0].toUpperCase()}${slug.slice(1)}: ` : '';
      const parts = [s.headline, s.feelings && `Feelings: ${s.feelings}`, s.impact && `Impact: ${s.impact}`].filter(Boolean);
      for (const p of parts) lines.push(`- ${prefix}${p}`);
      if (parts.length) any = true;
    }
    if (!any) lines.push('-');
    lines.push('');
  };
  section('Business', ['work']);
  section('Family & Friends', ['people']);
  section('Personal', ['body', 'mind']);

  lines.push('## Scores');
  for (const [label, slug] of EO_SCORES) {
    const v = input.scores[slug]?.score;
    lines.push(`- ${label}: ${v ?? '-'}`);
  }
  lines.push('');

  for (const [title, horizon] of [['30 day goals', '30d'], ['60 day goals', '60d']] as const) {
    const gs = input.goals.filter((g) => g.horizon === horizon);
    lines.push(`## ${title}`);
    lines.push(...(gs.length ? gs.map((g) => `- ${g.title}`) : ['-']));
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

// ===== Claude highlights =====

type Material = { area: string; items: string[] };

async function draftHighlights(period: string, material: Material[], areaNames: Record<string, string>): Promise<Record<string, string>> {
  if (!process.env.ANTHROPIC_API_KEY || material.length === 0) return {};
  const slugs = material.map((m) => m.area);
  const client = new Anthropic();

  const content = material
    .map((m) => `<area slug="${m.area}" name="${areaNames[m.area] ?? m.area}">\n${m.items.join('\n\n')}\n</area>`)
    .join('\n\n');

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
          required: ['highlights'],
          properties: {
            highlights: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['area', 'text'],
                properties: { area: { type: 'string', enum: slugs }, text: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    system:
      'You draft the auto-filled highlights of a private monthly life review for its one owner, Dave. ' +
      'For each area given, write two or three plain sentences on what happened and any recurring themes, ' +
      'using only the material provided. Address Dave as "you". Be concrete: names, places, numbers. ' +
      'Do not invent facts, give advice or score the month. Do not use em dashes.',
    messages: [
      {
        role: 'user',
        content: `Month: ${periodLabel(period)}\n\nMaterial by area:\n\n${content}\n\nReturn one highlight per area that has something worth noting.`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') return {};
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  try {
    const parsed = JSON.parse(text) as { highlights: { area: string; text: string }[] };
    return Object.fromEntries(parsed.highlights.filter((h) => slugs.includes(h.area)).map((h) => [h.area, h.text.trim()]));
  } catch {
    return {};
  }
}

// ===== Draft builder (W6) =====

export type DraftResult = {
  period: string;
  reviewId: string | null;
  action: 'inserted' | 'updated' | 'merged' | 'skipped_done';
  highlights: number;
  goalsChecked: number;
};

export async function buildReviewDraft(period: string): Promise<DraftResult> {
  const finish = await startRun('review');
  try {
    const result = await build(period);
    await finish({ itemsIn: 1, itemsOut: result.action === 'skipped_done' ? 0 : 1 });
    return result;
  } catch (e) {
    await finish({ error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

async function build(period: string): Promise<DraftResult> {
  const db = lifeAdmin;
  const owner = await getOwnerId();
  const from = periodStart(period);
  const to = periodEnd(period);

  const [areas, metrics] = await Promise.all([getAreas(db), getMetrics(db)]);
  const areaSlug = new Map(areas.map((a) => [a.id, a.slug]));
  const areaNames = Object.fromEntries(areas.map((a) => [a.slug, a.name]));

  const [summaries, trips, journalCounts, entriesRes, recordsRes] = await Promise.all([
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
  ]);
  if (entriesRes.error) throw new Error(entriesRes.error.message);
  if (recordsRes.error) throw new Error(recordsRes.error.message);

  const entries = (entriesRes.data ?? []) as { area_id: string | null; kind: string; entry_date: string; title: string | null; body_md: string }[];
  const records = (recordsRes.data ?? []) as { area_id: string; kind: string; title: string; started_on: string | null }[];
  const nightsAway = trips.reduce((n, t) => n + nightsInRange(t, from, to), 0);

  // Material for Claude, grouped by area.
  const material = new Map<string, string[]>();
  const push = (slug: string, s: string) => {
    if (!material.has(slug)) material.set(slug, []);
    material.get(slug)!.push(s);
  };
  for (const e of entries) {
    const slug = (e.area_id && areaSlug.get(e.area_id)) || 'mind';
    push(slug, `[${e.kind} ${e.entry_date}] ${e.title ?? ''}\n${e.body_md}`.trim());
  }
  for (const r of records) push(areaSlug.get(r.area_id) ?? 'mind', `[record ${r.kind} ${r.started_on ?? ''}] ${r.title}`);
  for (const t of trips) push('places', `[trip ${t.start_on} to ${t.end_on ?? 'open'}] ${t.title} (${t.purpose})`);

  const highlights = await draftHighlights(
    period,
    [...material.entries()].map(([area, items]) => ({ area, items })),
    areaNames
  );

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
    highlights,
    goals_checked: goalsChecked,
  };

  const { data: existing, error: exErr } = await db
    .from('reviews')
    .select('id, status, entry_id, auto_summary')
    .eq('owner_id', owner)
    .eq('period', period)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);

  const base = { period, reviewId: (existing?.id as string | undefined) ?? null, highlights: Object.keys(highlights).length, goalsChecked: goalsChecked.length };

  if (!existing) {
    const { data, error } = await db
      .from('reviews')
      .insert({ owner_id: owner, period, status: 'draft', auto_summary: autoSummary })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { ...base, reviewId: data.id, action: 'inserted' };
  }
  if (existing.entry_id) {
    // Imported from an EO update: keep everything the owner wrote, merge numbers in.
    const merged = { ...((existing.auto_summary as object) ?? {}), ...autoSummary };
    const { error } = await db.from('reviews').update({ auto_summary: merged }).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return { ...base, action: 'merged' };
  }
  if (existing.status === 'done') return { ...base, action: 'skipped_done' };

  const { error } = await db.from('reviews').update({ auto_summary: autoSummary }).eq('id', existing.id);
  if (error) throw new Error(error.message);
  return { ...base, action: 'updated' };
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
