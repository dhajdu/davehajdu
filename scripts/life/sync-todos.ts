// Carries the journal's DOING and dated DONE lists into `todos`.
//   node --experimental-strip-types scripts/life/sync-todos.ts            # every Notion journal entry
//   node --experimental-strip-types scripts/life/sync-todos.ts --since=2026-10-01
//   node --experimental-strip-types scripts/life/sync-todos.ts --dry-run  # parse only, print what each entry holds
import * as nodeModule from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true };
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
const { syncTodosFromJournal } = await import('../../src/lib/life/todos-sync');
const { parseTodoBlocks } = await import('../../src/lib/life/focus-parse');
const { NotionClient } = await import('../../src/lib/life/notion/client');
const { fetchLatestJournal } = await import('../../src/lib/life/notion/latest');

loadEnv();
const db = adminFromEnv();
const owner = await ownerIdFrom(db);
const since = process.argv.find((a) => a.startsWith('--since='))?.slice('--since='.length);
if (process.argv.includes('--dry-run')) {
  let q = db.from('entries').select('entry_date, title, body_md').eq('owner_id', owner).eq('kind', 'journal').not('external_id', 'is', null).order('entry_date', { ascending: false }).limit(8);
  if (since) q = q.gte('entry_date', since);
  const { data } = await q;
  for (const e of (data ?? []) as { entry_date: string; title: string; body_md: string }[]) {
    const b = parseTodoBlocks(e.body_md, e.entry_date);
    console.log(`\n== ${e.entry_date} ${e.title}: ${b.doing.length} doing, ${b.done.reduce((n, g) => n + g.items.length + g.items.reduce((m, i) => m + i.children.length, 0), 0)} done in ${b.done.length} days`);
    for (const d of b.doing) console.log(`  [ ] ${d.title}${d.children.length ? ` (+${d.children.length})` : ''}`);
    for (const g of b.done) console.log(`  ${g.date}: ${g.items.map((i) => i.title + (i.children.length ? ` (+${i.children.length})` : '')).join(' · ')}`);
  }
} else {
  const notion = new NotionClient({ token: process.env.NOTION_TOKEN ?? '' });
  const live = await fetchLatestJournal(notion);
  if (live) {
    const b = parseTodoBlocks(live.md, live.date);
    console.log(`Newest Notion page: ${live.title} (${live.date}), ${b.doing.length} open items`);
  }
  const report = await syncTodosFromJournal(db, owner, since, live);
  console.log(JSON.stringify(report));
}
