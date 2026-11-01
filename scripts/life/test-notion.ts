// Offline tests for the Notion import transforms.
//   node --experimental-strip-types scripts/life/test-notion.ts
import assert from 'node:assert/strict';
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
const n = await import('../../src/lib/life/notion');
import type { NBlock } from '../../src/lib/life/notion';

let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${(e as Error).message}`);
  }
}

// ---- fixtures ----
let seq = 0;
const rt = (s: string) => [{ plain_text: s, type: 'text', annotations: {} }];
const block = (type: string, text = '', extra: Record<string, unknown> = {}, children?: NBlock[]): NBlock => ({
  id: `b${++seq}`,
  type,
  has_children: !!children?.length,
  [type]: { rich_text: rt(text), ...extra },
  ...(children ? { children } : {}),
});
const p = (t: string) => block('paragraph', t);
const h2 = (t: string, children?: NBlock[]) => block('heading_2', t, { is_toggleable: !!children }, children);
const h3 = (t: string, children?: NBlock[]) => block('heading_3', t, { is_toggleable: !!children }, children);

// ---- date parser ----
test('Aug 23 takes year from created time', () => {
  const d = n.parseTitleDate('Sugar Forum: Aug 23', '2023-08-24T03:00:00.000Z');
  assert.equal(d.date, '2023-08-23');
  assert.equal(d.source, 'title');
});
test('Forum Shadow - Oct 8, created in early January, is the previous October', () => {
  assert.equal(n.parseTitleDate('Forum Shadow - Oct 8', '2025-01-02T00:00:00Z').date, '2024-10-08');
});
test('Sept 10th ordinal', () => {
  assert.equal(n.parseTitleDate('Shadow Sept 10th', '2024-09-11T00:00:00Z').date, '2024-09-10');
});
test('March 18 full month', () => {
  assert.equal(n.parseTitleDate('Forum March 18', '2022-03-20T00:00:00Z').date, '2022-03-18');
});
test('Mar 15th + Apr 26, 2022 takes the first date with the later year', () => {
  const d = n.parseTitleDate('Sugar Forum Mar 15th + Apr 26, 2022', '2022-04-27T00:00:00Z');
  assert.equal(d.date, '2022-03-15');
  assert.equal(d.yearExplicit, true);
  assert.equal(d.mismatch, false);
});
test('title wins over a wrong created date and flags the mismatch', () => {
  const d = n.parseTitleDate('Sugar Forum Feb 15, 2025', '2025-06-01T00:00:00Z');
  assert.equal(d.date, '2025-02-15');
  assert.equal(d.mismatch, true);
  assert.ok(d.mismatchDays > 45);
});
test('2028 year anomaly keeps month/day, infers year, keeps the literal', () => {
  const d = n.parseTitleDate('Forum Shadow - May 25, 2028', '2025-05-26T00:00:00Z');
  assert.equal(d.yearAnomaly, true);
  assert.equal(d.date, '2025-05-25');
  assert.equal(d.literalDate, '2028-05-25');
  assert.equal(d.mismatch, false);
});
test('no date in title falls back to created day in ICT', () => {
  const d = n.parseTitleDate('Thoughts on hiring', '2023-04-30T20:00:00Z');
  assert.equal(d.source, 'created');
  assert.equal(d.date, '2023-05-01');
});
test('ISO title', () => {
  assert.equal(n.parseTitleDate('2021-07-04', '2021-07-04T01:00:00Z').date, '2021-07-04');
});
test('invalid day is ignored', () => {
  assert.equal(n.parseTitleDate('Feb 30', '2024-02-10T00:00:00Z').source, 'created');
});

// ---- template stripping ----
test('blocks on 5+ pages are template; the day text stays', () => {
  const vision = p('My vision: build a company that lasts and a family that thrives together.');
  const goals = block('bulleted_list_item', 'Monthly goal: run 100km and read 4 books this month');
  const pages = Array.from({ length: 6 }, (_, i) => ({
    id: `page${i}`,
    blocks: n.toTopBlocks([
      h2('General Journal: No Holds Barred'),
      p(`Day ${i}: today I talked with the team about pricing.`),
      vision,
      goals,
      block('divider'),
      p(''),
    ]),
  }));
  const r = n.stripTemplates(pages);
  const body = r.bodies.get('page3')!;
  assert.ok(body.includes('Day 3: today I talked'), body);
  assert.ok(!body.includes('My vision'), body);
  assert.ok(!body.includes('Monthly goal'), body);
  assert.ok(body.startsWith('## General Journal'), 'template heading kept before own content');
  assert.equal(r.templates.size, 3); // heading, vision, goals
});
test('a block on 4 pages is not template', () => {
  const shared = p('Shared across only four pages, still real writing for those days.');
  const pages = Array.from({ length: 4 }, (_, i) => ({ id: `q${i}`, blocks: n.toTopBlocks([shared]) }));
  const r = n.stripTemplates(pages);
  assert.equal(r.templates.size, 0);
  assert.ok(r.bodies.get('q0')!.includes('Shared across'));
});
test('known template hashes are stripped in a small incremental batch', () => {
  const tpl = p('The One Thing Learnings: focus on the one thing that makes everything else easier.');
  const [tb] = n.toTopBlocks([tpl]);
  const r = n.stripTemplates([{ id: 'x', blocks: n.toTopBlocks([tpl, p('Own words for today.')]) }], { known: new Set([tb.hash]) });
  assert.equal(r.bodies.get('x'), 'Own words for today.');
});
test('checkbox state and formatting do not change the hash', () => {
  const a = n.toTopBlocks([block('to_do', 'Meditate', { checked: true })])[0].hash;
  const b = n.toTopBlocks([block('to_do', 'Meditate', { checked: false })])[0].hash;
  assert.equal(a, b);
});

// ---- learnings splitter ----
test('one learning per h3 toggle, external id from normalised title', () => {
  const learnings = h2('🎓 Learnings', [
    h3('Shadow July 28, 2026', [p('Delegate the outcome, not the task.')]),
    h3('Sugar Forum Feb 15, 2025', [block('bulleted_list_item', 'Say no faster')]),
  ]);
  const tree = [p('Update text'), block('synced_block', '', { synced_from: null }, [learnings])];
  const hit = n.findLearnings(tree)!;
  assert.equal(hit.topIndex, 1);
  const ls = n.splitLearnings(hit.block, '2026-08-01');
  assert.equal(ls.length, 2);
  assert.equal(ls[0].externalId, 'learning:shadow-july-28-2026');
  assert.equal(ls[0].date, '2026-07-28');
  assert.equal(ls[0].bodyMd, 'Delegate the outcome, not the task.');
  assert.equal(ls[1].date, '2025-02-15');
  assert.equal(ls[1].bodyMd, '- Say no faster');
});
test('the same learning on two pages has the same external id', () => {
  const mk = () => n.splitLearnings(h2('Learnings', [h3('Shadow  July 28, 2026 ', [p('x')])]), '2026-08-01');
  assert.equal(mk()[0].externalId, n.splitLearnings(h2('Learnings', [h3('shadow july 28, 2026', [p('y')])]), '2026-09-01')[0].externalId);
});
test('plain h3 owns following siblings', () => {
  const ls = n.splitLearnings(h2('Learnings', [h3('Forum Oct 8'), p('one'), p('two'), h3('Forum Nov 5'), p('three')]), '2024-11-20');
  assert.deepEqual(ls.map((l) => l.bodyMd), ['one\n\ntwo', 'three']);
  assert.equal(ls[0].date, '2024-10-08');
});
test('presentation toggle lists child pages', () => {
  const tree = [block('toggle', 'Presentation', {}, [{ id: 'cp1', type: 'child_page', has_children: true, child_page: { title: 'Q3 Deck' } }])];
  assert.deepEqual(n.findPresentationPages(tree), [{ id: 'cp1', title: 'Q3 Deck' }]);
});

// ---- EO mapping ----
test('EO properties map to areas; 76 is flagged invalid', () => {
  const s = n.eoScores({ 'Physical Health': 7, 'Mental Health': 8, 'Financial Health': 76, 'Friends/Family': 9, 'Professional Progress': 6.5 });
  assert.deepEqual(s.map((x) => [x.area, x.value, x.valid]), [
    ['body', 7, true],
    ['mind', 8, true],
    ['money', 76, false],
    ['people', 9, true],
    ['work', 6.5, true],
  ]);
});
test('missing scores are skipped', () => {
  assert.equal(n.eoScores({ 'Physical Health': null }).length, 0);
});
test('review period from title date', () => {
  assert.equal(n.reviewPeriod(n.parseTitleDate('Sugar Forum: Aug 23', '2023-09-02T00:00:00Z').date), '2023-08');
});
test('journal tags map to areas, default mind', () => {
  assert.equal(n.journalArea(['Health']), 'body');
  assert.equal(n.journalArea(['Relationship']), 'people');
  assert.equal(n.journalArea(['EO', 'Health']), 'work');
  assert.equal(n.journalArea(['Finance']), 'money');
  assert.equal(n.journalArea(['Chill']), 'mind');
  assert.equal(n.journalArea([]), 'mind');
});

// ---- markdown ----
test('markdown converter covers common blocks', () => {
  const md = n.blocksToMarkdown([
    block('heading_1', 'Title'),
    block('bulleted_list_item', 'a', {}, [block('bulleted_list_item', 'a1')]),
    block('numbered_list_item', 'b'),
    block('to_do', 'c', { checked: true }),
    block('quote', 'q'),
    block('callout', 'note', { icon: { emoji: '💡' } }),
    block('code', 'x = 1', { language: 'python' }),
    { id: 'm', type: 'paragraph', has_children: false, paragraph: { rich_text: [{ plain_text: 'Dave', type: 'mention' }, { plain_text: ' site', type: 'text', href: 'https://davehajdu.com' }] } },
  ]);
  assert.equal(
    md,
    '# Title\n\n- a\n  - a1\n1. b\n- [x] c\n\n> q\n\n> 💡 note\n\n```python\nx = 1\n```\n\nDave[ site](https://davehajdu.com)'
  );
});

console.log(`${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL ' + f);
if (failures.length) process.exit(1);
