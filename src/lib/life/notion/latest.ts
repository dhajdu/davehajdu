import { JOURNAL_DATA_SOURCE, NotionClient, pageTitle } from './client';
import { blocksToMarkdown } from './markdown';
import { parseTitleDate } from './dates';

// The newest journal page, whole. Synced entries keep only each day's new
// lines, so the full DOING list (what is open right now) has to come from
// the page itself.
export async function fetchLatestJournal(notion: NotionClient): Promise<{ date: string; title: string; md: string } | null> {
  const [page] = await notion.queryDataSource(JOURNAL_DATA_SOURCE, { newestFirst: true, limit: 1 });
  if (!page) return null;
  const tree = await notion.getBlockTree(page.id, { cacheKey: `${page.id}:${page.last_edited_time}` });
  const title = pageTitle(page);
  return { date: parseTitleDate(title, page.created_time).date, title, md: blocksToMarkdown(tree) };
}
