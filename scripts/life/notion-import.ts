// Notion → /life import.
//   node --experimental-strip-types scripts/life/notion-import.ts --dry-run
//   node --experimental-strip-types scripts/life/notion-import.ts
//   node --experimental-strip-types scripts/life/notion-import.ts --since=2026-10-01T00:00:00Z
// Reads .env.local (NOTION_TOKEN, NEXT_PUBLIC_LIFE_SUPABASE_URL, LIFE_SUPABASE_SECRET_KEY, LIFE_OWNER_EMAIL).
// Idempotent: entries upsert on (owner_id, external_id), anomalies are queued once.
import * as nodeModule from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Lets Node resolve the extensionless imports the Next.js code uses (Node 23.5+).
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

const { loadEnv, adminFromEnv, ownerIdFrom, fileTreeCache } = await import('./_shared');
const { NotionClient, runNotionSync } = await import('../../src/lib/life/notion');

loadEnv();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noCache = args.includes('--no-cache');
const since = args.find((a) => a.startsWith('--since='))?.slice('--since='.length);
if (since && Number.isNaN(Date.parse(since))) throw new Error(`--since is not a date: ${since}`);

const notion = new NotionClient({ token: process.env.NOTION_TOKEN ?? '', cache: noCache ? undefined : fileTreeCache() });
let db = null;
let ownerId = null;
if (!dryRun || (process.env.LIFE_SUPABASE_SECRET_KEY && process.env.LIFE_OWNER_EMAIL)) {
  db = adminFromEnv();
  ownerId = await ownerIdFrom(db);
}

const started = Date.now();
const report = await runNotionSync(
  { notion, db, ownerId },
  { since: since ? new Date(since).toISOString() : undefined, dryRun, log: (m) => console.log(m) }
);

console.log(`\n${dryRun ? 'DRY RUN (nothing written)' : 'Imported'} in ${Math.round((Date.now() - started) / 1000)}s, ${report.notionRequests} Notion requests`);
console.log(`Pages: ${report.journalPages} journal, ${report.eoPages} EO`);
console.log(`Entries: ${Object.entries(report.entries).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`Reviews ${report.reviews}, scores ${report.scores}, measurements ${report.measurements}, ${dryRun ? 'anomalies' : 'queued'} ${report.queued}`);
for (const a of report.anomalies) console.log(`  [${a.kind}] ${a.reason}`);
if (dryRun) {
  for (const s of report.samples) {
    console.log(`\n----- ${s.date} ${s.title} (${s.body.length} chars) -----`);
    console.log(s.body.length > 1500 ? s.body.slice(0, 1500) + '\n[...]' : s.body);
  }
}
