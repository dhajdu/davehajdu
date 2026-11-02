// Imports one lab panel from a JSON transcription:
//   node --experimental-strip-types scripts/life/import-lab.ts "/path/to/2026-10-29-diag.json"
// Writes the PDF to the private bucket (if `file` is set), a `documents` row
// with the panel as text (for Ask), a Body record (kind lab), one
// `lab_results` row per analyte, and a `measurements` row for every analyte
// that names a tracked metric (`m`). Idempotent on (tested_on, analyte).
//
// JSON shape:
// { "lab": "Diag", "tested_on": "2026-10-29", "file": "26020820467_en.pdf", "title": "Blood panel at Diag",
//   "rows": [ { "c": "lipids", "p": "Lipid Basic Panel", "a": "LDL Cholesterol", "v": 6.63, "u": "mmol/L",
//               "hi": 2.59, "ref": "Optimal under 2.59 ...", "m": "ldl" },
//             { "c": "urine", "a": "Glucose (urine)", "t": "2+ Positive", "ref": "Negative", "flag": "abnormal" },
//             { "c": "biochemistry", "a": "Glucose (fasting)", "v": 132, "u": "mg/dL", "m": "glucose_fasting", "mv": 7.33 } ],
//   "notes": "Free text appended to the document for Ask (diagnoses, medications)." }
// `file` is relative to the JSON's folder. Flags are worked out from lo/hi unless given.
// `mv` is the value in the tracked metric's own unit when the report prints another unit.
import * as nodeModule from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\.[cm]?[jt]s$/.test(spec) && ctx.parentURL) {
      for (const ext of ['.ts', '/index.ts']) {
        const u = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
      }
    }
    return next(spec, ctx);
  },
});
const { loadEnv, adminFromEnv, ownerIdFrom } = await import('./_shared');

type Row = { c: string; p?: string; a: string; v?: number; t?: string; u?: string; lo?: number; hi?: number; ref?: string; flag?: 'normal' | 'low' | 'high' | 'abnormal'; m?: string; mv?: number };
type Panel = { lab: string; tested_on: string; file?: string; title?: string; notes?: string; rows: Row[] };

const jsonPath = process.argv[2];
if (!jsonPath) throw new Error('Usage: import-lab.ts <panel.json>');
const panel = JSON.parse(readFileSync(jsonPath, 'utf8')) as Panel;
if (!/^\d{4}-\d{2}-\d{2}$/.test(panel.tested_on)) throw new Error('tested_on must be YYYY-MM-DD');

loadEnv();
const db = adminFromEnv();
const owner = await ownerIdFrom(db);
const check = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

const flagOf = (r: Row): NonNullable<Row['flag']> => {
  if (r.flag) return r.flag;
  if (r.v === undefined) return 'normal';
  if (r.lo !== undefined && r.v < r.lo) return 'low';
  if (r.hi !== undefined && r.v > r.hi) return 'high';
  return 'normal';
};
const refLabel = (r: Row) => r.ref ?? (r.lo !== undefined && r.hi !== undefined ? `${r.lo} to ${r.hi}` : r.hi !== undefined ? `under ${r.hi}` : r.lo !== undefined ? `${r.lo} and up` : '');

// 1. Document: the PDF and the panel as text.
let documentId: string | null = null;
const text = [`${panel.lab} laboratory report, sample collected ${panel.tested_on}. Reference ranges in brackets.`, '']
  .concat(
    panel.rows.map((r) => {
      const val = r.v !== undefined ? `${r.v}${r.u ? ` ${r.u}` : ''}` : (r.t ?? '');
      const f = flagOf(r);
      return `${r.c}${r.p ? ` / ${r.p}` : ''}: ${r.a} ${val}${refLabel(r) ? ` [${refLabel(r)}]` : ''}${f !== 'normal' ? ` ${f.toUpperCase()}` : ''}`;
    })
  )
  .concat(panel.notes ? ['', panel.notes] : [])
  .join('\n');
if (panel.file) {
  const local = join(dirname(jsonPath), panel.file);
  const storagePath = `documents/${panel.tested_on}-${panel.lab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-lab-panel.pdf`;
  const up = await db.storage.from('life-files').upload(storagePath, readFileSync(local), { contentType: 'application/pdf', upsert: true });
  if (up.error) throw new Error(up.error.message);
  const { data: existing } = await db.from('documents').select('id').eq('owner_id', owner).eq('storage_path', storagePath).maybeSingle();
  const docRow = { owner_id: owner, storage_path: storagePath, mime: 'application/pdf', title: `Blood panel, ${panel.lab}`, doc_date: panel.tested_on, text };
  if (existing) {
    check((await db.from('documents').update(docRow).eq('id', existing.id)).error);
    documentId = existing.id;
  } else {
    const { data, error } = await db.from('documents').insert(docRow).select('id').single();
    check(error);
    documentId = data!.id;
  }
}

// 2. Body record for the panel.
const { data: body } = await db.from('areas').select('id').eq('slug', 'body').single();
const flagged = panel.rows.filter((r) => flagOf(r) !== 'normal');
const notes = flagged.length
  ? `Out of range: ${flagged.map((r) => `${r.a} ${r.v !== undefined ? r.v : (r.t ?? '')}${r.u ? ` ${r.u}` : ''}`).join(', ')}.`
  : 'Everything in range.';
const { data: rec0 } = await db.from('records').select('id').eq('owner_id', owner).eq('kind', 'lab').eq('started_on', panel.tested_on).maybeSingle();
let recordId: string;
if (rec0) {
  check((await db.from('records').update({ notes }).eq('id', rec0.id)).error);
  recordId = rec0.id;
} else {
  const { data, error } = await db
    .from('records')
    .insert({ owner_id: owner, area_id: body!.id, kind: 'lab', title: panel.title ?? `Blood panel at ${panel.lab}`, started_on: panel.tested_on, notes })
    .select('id')
    .single();
  check(error);
  recordId = data!.id;
}
if (documentId) {
  check(
    (await db.from('links').upsert(
      { owner_id: owner, from_type: 'records', from_id: recordId, to_type: 'documents', to_id: documentId, relation: 'attached' },
      { onConflict: 'from_type,from_id,to_type,to_id,relation', ignoreDuplicates: true }
    )).error
  );
}

// 3. Every analyte.
const rows = panel.rows.map((r, i) => ({
  owner_id: owner,
  record_id: recordId,
  document_id: documentId,
  tested_on: panel.tested_on,
  lab: panel.lab,
  category: r.c,
  panel: r.p ?? null,
  analyte: r.a,
  value: r.v ?? null,
  value_text: r.t ?? null,
  unit: r.u ?? null,
  ref_low: r.lo ?? null,
  ref_high: r.hi ?? null,
  ref_text: refLabel(r) || null,
  flag: flagOf(r),
  sort_order: i,
}));
check((await db.from('lab_results').upsert(rows, { onConflict: 'owner_id,tested_on,analyte' })).error);

// 4. Tracked markers to measurements.
const tracked = panel.rows.filter((r) => r.m && r.v !== undefined);
if (tracked.length) {
  const { data: metrics, error } = await db.from('metrics').select('id, slug').in('slug', tracked.map((r) => r.m!));
  check(error);
  const bySlug = new Map((metrics ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id]));
  const missing = tracked.filter((r) => !bySlug.has(r.m!)).map((r) => r.m);
  if (missing.length) throw new Error(`No metric for: ${missing.join(', ')}`);
  check(
    (await db.from('measurements').upsert(
      tracked.map((r) => ({ owner_id: owner, metric_id: bySlug.get(r.m!)!, measured_on: panel.tested_on, value: r.mv ?? r.v })),
      { onConflict: 'owner_id,metric_id,measured_on' }
    )).error
  );
}

console.log(`${panel.lab} ${panel.tested_on}: ${rows.length} results (${flagged.length} flagged), ${tracked.length} tracked markers, record ${recordId}${documentId ? `, document ${documentId}` : ''}`);
