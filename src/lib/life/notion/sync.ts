// Notion → /life import and incremental sync. Shared by scripts/life/notion-import.ts
// and the nightly cron route. No server-only imports: the caller passes the
// Supabase admin client and owner id.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NBlock, NPage } from './client';
import { EO_DATA_SOURCE, JOURNAL_DATA_SOURCE, NotionClient, pageTitle, propMulti, propNumber, propText } from './client';
import { blocksToMarkdown } from './markdown';
import { normaliseMd, stripTemplates, toTopBlocks } from './template';
import type { TemplateBlock } from './template';
import { parseTitleDate } from './dates';
import type { ParsedDate } from './dates';
import { eoScoresFromPage, findLearnings, findPresentationPages, journalArea, reviewPeriod, splitLearnings } from './mapping';
import type { EoScore, Learning } from './mapping';

export interface SyncOptions {
  since?: string; // ISO; only pages edited on or after it (plus the newest journal pages for template context)
  dryRun?: boolean;
  recentJournalContext?: number; // incremental only, default 7
  log?: (msg: string) => void;
}

export interface SyncContext {
  notion: NotionClient;
  db: SupabaseClient | null; // null is allowed for dry runs
  ownerId: string | null;
}

export interface SyncReport {
  journalPages: number;
  eoPages: number;
  entries: Record<'journal' | 'eo_update' | 'learning' | 'presentation' | 'reference', number>;
  reviews: number;
  scores: number;
  measurements: number;
  queued: number;
  anomalies: { kind: string; title: string; reason: string }[];
  samples: { title: string; date: string; body: string }[];
  notionRequests: number;
}

type Row = Record<string, unknown>;

interface QueueDraft {
  pageId: string;
  area?: string;
  kind: string;
  reason: string;
  confidence: number;
  // Built after writes, once row ids exist.
  build: (ids: { entry: (extId: string) => string | undefined; review: (period: string) => string | undefined; area: (slug: string) => string | undefined }) => Row | null;
}

const TEMPLATE_THRESHOLD = 5;
const MIN_REFERENCE_CHARS = 40;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function dedupePages(lists: NPage[][]): NPage[] {
  const m = new Map<string, NPage>();
  for (const l of lists) for (const p of l) m.set(p.id, p);
  return [...m.values()];
}

function firstLine(md: string): string {
  const line = md.split('\n').find((l) => l.trim()) ?? '';
  const t = normaliseMd(line).replace(/\[ \]/g, '').trim();
  return t.length > 80 ? t.slice(0, 77) + '...' : t;
}

function dateQueue(page: NPage, title: string, d: ParsedDate): QueueDraft | null {
  if (d.yearAnomaly && d.literalDate) {
    const literal = d.literalDate;
    return {
      pageId: page.id,
      kind: 'notion_date_year',
      confidence: 0.3,
      reason: `"${title}" says ${literal} but the page was created ${d.createdDate}. Imported as ${d.date}; approve to use the literal title date.`,
      build: (ids) => {
        const id = ids.entry(page.id);
        return id ? { action: 'update', table: 'entries', id, values: { entry_date: literal } } : null;
      },
    };
  }
  if (d.mismatch) {
    const created = d.createdDate;
    return {
      pageId: page.id,
      kind: 'notion_date_mismatch',
      confidence: 0.5,
      reason: `"${title}" title date ${d.date} is ${d.mismatchDays} days from its created date ${created}. Imported with the title date; approve to use the created date instead.`,
      build: (ids) => {
        const id = ids.entry(page.id);
        return id ? { action: 'update', table: 'entries', id, values: { entry_date: created } } : null;
      },
    };
  }
  return null;
}

async function loadKnownTemplates(db: SupabaseClient, ownerId: string): Promise<Set<string>> {
  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('entries')
      .select('external_id')
      .eq('owner_id', ownerId)
      .eq('kind', 'reference')
      .like('external_id', 'template:%')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) known.add(String(r.external_id).slice('template:'.length));
    if (!data || data.length < 1000) break;
  }
  return known;
}

function sourcePayload(page: NPage, database: 'journal' | 'eo_updates') {
  const props: Record<string, unknown> = {};
  for (const [k, p] of Object.entries(page.properties)) {
    if (p.type === 'title' || p.type === 'rich_text' || p.type === 'select') props[k] = propText(page, k);
    else if (p.type === 'number') props[k] = p.number ?? null;
    else if (p.type === 'multi_select') props[k] = propMulti(page, k);
  }
  return { database, url: page.url, created_time: page.created_time, last_edited_time: page.last_edited_time, properties: props };
}

export async function runNotionSync(ctx: SyncContext, opts: SyncOptions = {}): Promise<SyncReport> {
  const log = opts.log ?? (() => {});
  const { notion, db, ownerId } = ctx;
  const write = !opts.dryRun;
  if (write && (!db || !ownerId)) throw new Error('A database client and owner id are required unless dryRun');

  // ---- Fetch pages ----
  const journalPages = opts.since
    ? dedupePages([
        await notion.queryDataSource(JOURNAL_DATA_SOURCE, { editedSince: opts.since }),
        await notion.queryDataSource(JOURNAL_DATA_SOURCE, { newestFirst: true, limit: opts.recentJournalContext ?? 7 }),
      ])
    : await notion.queryDataSource(JOURNAL_DATA_SOURCE);
  const eoPages = await notion.queryDataSource(EO_DATA_SOURCE, opts.since ? { editedSince: opts.since } : {});
  log(`Notion: ${journalPages.length} journal pages, ${eoPages.length} EO pages`);

  let done = 0;
  const progress = () => {
    done++;
    if (done % 25 === 0) log(`  fetched ${done}/${journalPages.length + eoPages.length} page bodies (${notion.requests} requests)`);
  };
  const journalTrees = await mapLimit(journalPages, 3, async (p) => {
    const t = await notion.getBlockTree(p.id, { cacheKey: `${p.id}:${p.last_edited_time}` });
    progress();
    return t;
  });
  const eoTrees = await mapLimit(eoPages, 3, async (p) => {
    const t = await notion.getBlockTree(p.id, { resolveSynced: true, cacheKey: `${p.id}:${p.last_edited_time}:synced` });
    progress();
    return t;
  });

  const known = db && ownerId ? await loadKnownTemplates(db, ownerId) : new Set<string>();

  const entries: Row[] = [];
  const references = new Map<string, { t: TemplateBlock; date: string }>();
  const weights: Row[] = [];
  const queue: QueueDraft[] = [];
  const pageDate = new Map<string, string>();
  const report: SyncReport = {
    journalPages: journalPages.length,
    eoPages: eoPages.length,
    entries: { journal: 0, eo_update: 0, learning: 0, presentation: 0, reference: 0 },
    reviews: 0,
    scores: 0,
    measurements: 0,
    queued: 0,
    anomalies: [],
    samples: [],
    notionRequests: 0,
  };

  const addTemplates = (templates: Map<string, TemplateBlock>) => {
    for (const [hash, t] of templates) {
      if (normaliseMd(t.md).length < MIN_REFERENCE_CHARS) continue;
      const date = t.pageIds.map((id) => pageDate.get(id) ?? '9999-12-31').sort()[0];
      const prev = references.get(hash);
      if (!prev || date < prev.date) references.set(hash, { t, date });
    }
  };

  // ---- Journal ----
  const journalDates = journalPages.map((p) => parseTitleDate(pageTitle(p), p.created_time));
  journalPages.forEach((p, i) => pageDate.set(p.id, journalDates[i].date));
  const journalStrip = stripTemplates(
    journalPages.map((p, i) => ({ id: p.id, blocks: toTopBlocks(journalTrees[i]) })),
    { threshold: TEMPLATE_THRESHOLD, known }
  );
  addTemplates(journalStrip.templates);

  journalPages.forEach((p, i) => {
    const title = pageTitle(p);
    const d = journalDates[i];
    const tags = propMulti(p, 'Tag');
    const body = journalStrip.bodies.get(p.id) ?? '';
    entries.push({ kind: 'journal', external_id: p.id, entry_date: d.date, title, body_md: body, notion_tags: tags, area: journalArea(tags) });
    const w = propNumber(p, 'Weight');
    if (w !== null && w >= 30 && w <= 250) weights.push({ metric: 'weight_kg', measured_on: d.date, value: w, pageId: p.id });
    const q = dateQueue(p, title, d);
    if (q) queue.push({ ...q, area: 'mind' });
  });
  report.samples = journalPages
    .map((p, i) => ({ title: pageTitle(p), date: journalDates[i].date, body: journalStrip.bodies.get(p.id) ?? '' }))
    .filter((s) => s.body.length > 200)
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((_, i) => i % 40 === 0)
    .slice(0, 3);

  // ---- EO updates ----
  const eoDates = eoPages.map((p) => parseTitleDate(pageTitle(p), p.created_time));
  eoPages.forEach((p, i) => pageDate.set(p.id, eoDates[i].date));
  const learnings = new Map<string, Learning>();
  const presentations: { id: string; title: string; date: string; parent: NPage }[] = [];
  const eoTop = eoPages.map((p, i) => {
    const tree = eoTrees[i];
    const hit = findLearnings(tree);
    if (hit) {
      for (const l of splitLearnings(hit.block, eoDates[i].date)) {
        const prev = learnings.get(l.externalId);
        if (!prev || l.bodyMd.length > prev.bodyMd.length) learnings.set(l.externalId, l);
      }
    }
    for (const c of findPresentationPages(tree)) presentations.push({ ...c, date: eoDates[i].date, parent: p });
    const blocks: NBlock[] = hit ? tree.filter((_, idx) => idx !== hit.topIndex) : tree;
    return { id: p.id, blocks: toTopBlocks(blocks) };
  });
  const eoStrip = stripTemplates(eoTop, { threshold: TEMPLATE_THRESHOLD, known });
  addTemplates(eoStrip.templates);

  const byPeriod = new Map<string, { page: NPage; date: string; scores: EoScore[] }[]>();
  eoPages.forEach((p, i) => {
    const title = pageTitle(p);
    const d = eoDates[i];
    entries.push({
      kind: 'eo_update',
      external_id: p.id,
      entry_date: d.date,
      title,
      body_md: eoStrip.bodies.get(p.id) ?? '',
      notion_tags: propMulti(p, 'Tags'),
      area: 'direction',
    });
    const q = dateQueue(p, title, d);
    if (q) queue.push({ ...q, area: 'direction' });
    const list = byPeriod.get(reviewPeriod(d.date)) ?? [];
    list.push({ page: p, date: d.date, scores: eoScoresFromPage(p) });
    byPeriod.set(reviewPeriod(d.date), list);
  });

  // One review per month: the EO page with the most scores, latest on a tie.
  const reviews: Row[] = [];
  const scoreRows: { period: string; area: string; score: number }[] = [];
  for (const [period, list] of byPeriod) {
    list.sort((a, b) => b.scores.length - a.scores.length || b.date.localeCompare(a.date));
    const chosen = list[0];
    reviews.push({ period, one_word: propText(chosen.page, 'One Word') || null, status: 'done', entryExt: chosen.page.id });
    const title = pageTitle(chosen.page);
    for (const s of chosen.scores) {
      if (s.valid) scoreRows.push({ period, area: s.area, score: s.value });
      else
        queue.push({
          pageId: chosen.page.id,
          area: s.area,
          kind: 'notion_score_out_of_range',
          confidence: 0.2,
          reason: `"${title}" ${s.prop} is ${s.value}, outside 0 to 10 (likely a weight in kg). Edit the score before approving.`,
          build: (ids) => {
            const review_id = ids.review(period);
            const area_id = ids.area(s.area);
            return review_id && area_id
              ? { action: 'upsert', table: 'review_scores', values: { review_id, area_id, score: s.value }, onConflict: 'review_id,area_id' }
              : null;
          },
        });
    }
  }

  for (const l of learnings.values()) {
    entries.push({ kind: 'learning', external_id: l.externalId, entry_date: l.date, title: l.title, body_md: l.bodyMd, notion_tags: [], area: 'mind' });
  }

  // Presentation child pages.
  const presTrees = await mapLimit(presentations, 3, (c) =>
    notion.getBlockTree(c.id, { cacheKey: `${c.id}:${c.parent.last_edited_time}` }).catch(() => [] as NBlock[])
  );
  presentations.forEach((c, i) => {
    entries.push({ kind: 'presentation', external_id: c.id, entry_date: c.date, title: c.title, body_md: blocksToMarkdown(presTrees[i]), notion_tags: [], area: 'work' });
  });

  const referenceRows: Row[] = [...references.entries()].map(([hash, { t, date }]) => ({
    kind: 'reference',
    external_id: `template:${hash}`,
    entry_date: date,
    title: firstLine(t.md),
    body_md: t.md,
    notion_tags: [],
    area: null,
  }));

  for (const e of entries) report.entries[e.kind as keyof SyncReport['entries']]++;
  report.entries.reference = referenceRows.length;
  report.reviews = reviews.length;
  report.scores = scoreRows.length;
  report.anomalies = queue.map((q) => ({ kind: q.kind, title: q.reason.split('"')[1] ?? '', reason: q.reason }));
  report.notionRequests = notion.requests;

  if (!write) {
    report.measurements = weights.length;
    report.queued = queue.length;
    return report;
  }

  // ---- Write ----
  const sb = db!;
  const owner = ownerId!;
  const must = <T>(res: { data: T | null; error: { message: string } | null }, what: string): T => {
    if (res.error) throw new Error(`${what}: ${res.error.message}`);
    return res.data as T;
  };

  const areaRows = must(await sb.from('areas').select('id, slug'), 'areas') as { id: string; slug: string }[];
  const areaId = new Map(areaRows.map((a) => [a.slug, a.id]));
  const metricRows = must(await sb.from('metrics').select('id, slug'), 'metrics') as { id: string; slug: string }[];
  const metricId = new Map(metricRows.map((m) => [m.slug, m.id]));
  const source = must(await sb.from('sources').select('id').eq('slug', 'notion').single(), 'sources') as { id: string };

  // source_items: one per Notion page, for traceability.
  const now = new Date().toISOString();
  const itemId = new Map<string, string>();
  const itemRows = [
    ...journalPages.map((p) => ({ p, db: 'journal' as const })),
    ...eoPages.map((p) => ({ p, db: 'eo_updates' as const })),
  ].map(({ p, db: d }) => ({
    owner_id: owner,
    source_id: source.id,
    external_id: p.id,
    received_at: now,
    processed_at: now,
    payload: sourcePayload(p, d),
  }));
  for (const c of chunks(itemRows, 200)) {
    const data = must(await sb.from('source_items').upsert(c, { onConflict: 'source_id,external_id' }).select('id, external_id'), 'source_items') as { id: string; external_id: string }[];
    for (const r of data) itemId.set(r.external_id, r.id);
  }

  const toEntryRow = (e: Row) => {
    const { area, ...rest } = e;
    return { ...rest, owner_id: owner, area_id: area ? areaId.get(String(area)) ?? null : null };
  };
  const entryId = new Map<string, string>();
  const uniqueEntries = [...new Map(entries.map((e) => [String(e.external_id), e])).values()];
  for (const c of chunks(uniqueEntries.map(toEntryRow), 50)) {
    const data = must(await sb.from('entries').upsert(c, { onConflict: 'owner_id,external_id' }).select('id, external_id'), 'entries') as { id: string; external_id: string }[];
    for (const r of data) entryId.set(r.external_id, r.id);
  }
  // Template references keep the values from their first import.
  for (const c of chunks(referenceRows.map(toEntryRow), 50)) {
    must(await sb.from('entries').upsert(c, { onConflict: 'owner_id,external_id', ignoreDuplicates: true }), 'reference entries');
  }

  const reviewId = new Map<string, string>();
  if (reviews.length) {
    const rows = reviews.map(({ entryExt, ...r }) => ({ ...r, owner_id: owner, entry_id: entryId.get(String(entryExt)) ?? null }));
    const data = must(await sb.from('reviews').upsert(rows, { onConflict: 'owner_id,period' }).select('id, period'), 'reviews') as { id: string; period: string }[];
    for (const r of data) reviewId.set(r.period, r.id);
  }
  const scoreInsert = scoreRows
    .map((s) => ({ owner_id: owner, review_id: reviewId.get(s.period), area_id: areaId.get(s.area), score: s.score }))
    .filter((s) => s.review_id && s.area_id);
  for (const c of chunks(scoreInsert, 200)) must(await sb.from('review_scores').upsert(c, { onConflict: 'review_id,area_id' }), 'review_scores');

  // Measurements: Notion weight never overwrites a day Apple Health already has.
  const weightMetric = metricId.get('weight_kg');
  const weightRows = weightMetric
    ? [...new Map(weights.map((w) => [w.measured_on, w])).values()].map((w) => ({
        owner_id: owner,
        metric_id: weightMetric,
        measured_on: w.measured_on,
        value: w.value,
        source_item_id: itemId.get(String(w.pageId)) ?? null,
      }))
    : [];
  for (const c of chunks(weightRows, 200)) {
    must(await sb.from('measurements').upsert(c, { onConflict: 'owner_id,metric_id,measured_on', ignoreDuplicates: true }), 'weight');
  }
  report.measurements = weightRows.length;

  // journal_entries: monthly count, recomputed from the table for every touched month.
  const countMetric = metricId.get('journal_entries');
  const months = [...new Set(journalDates.map((d) => d.date.slice(0, 7)))];
  if (countMetric && months.length) {
    const rows: Row[] = [];
    for (const m of months) {
      const start = `${m}-01`;
      const [y, mo] = m.split('-').map(Number);
      const end = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10);
      const { count, error } = await sb
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', owner)
        .eq('kind', 'journal')
        .gte('entry_date', start)
        .lt('entry_date', end);
      if (error) throw new Error(`journal count: ${error.message}`);
      rows.push({ owner_id: owner, metric_id: countMetric, measured_on: start, value: count ?? 0 });
    }
    must(await sb.from('measurements').upsert(rows, { onConflict: 'owner_id,metric_id,measured_on' }), 'journal_entries');
    report.measurements += rows.length;
  }

  // Review queue: never re-queue an anomaly already raised (whatever its status).
  const ids = { entry: (x: string) => entryId.get(x), review: (p: string) => reviewId.get(p), area: (s: string) => areaId.get(s) };
  const itemIds = [...new Set(queue.map((q) => itemId.get(q.pageId)).filter(Boolean))] as string[];
  const existing = new Set<string>();
  for (const c of chunks(itemIds, 100)) {
    const data = must(await sb.from('review_queue').select('source_item_id, kind, reason').eq('owner_id', owner).in('source_item_id', c), 'review_queue') as {
      source_item_id: string;
      kind: string;
      reason: string;
    }[];
    for (const r of data) existing.add(`${r.source_item_id}|${r.kind}|${r.reason}`);
  }
  const queueRows: Row[] = [];
  for (const q of queue) {
    const sid = itemId.get(q.pageId) ?? null;
    if (existing.has(`${sid}|${q.kind}|${q.reason}`)) continue;
    const proposed = q.build(ids);
    if (!proposed) continue;
    queueRows.push({
      owner_id: owner,
      source_item_id: sid,
      area_id: q.area ? areaId.get(q.area) ?? null : null,
      kind: q.kind,
      proposed,
      confidence: q.confidence,
      reason: q.reason,
    });
  }
  if (queueRows.length) must(await sb.from('review_queue').insert(queueRows), 'review_queue insert');
  report.queued = queueRows.length;
  report.notionRequests = notion.requests;
  return report;
}
