// Minimal Notion REST client: data source queries and recursive block trees.
// Pure (no server-only), so scripts run it under `node --experimental-strip-types`.

export const NOTION_VERSION = '2025-09-03';

export const JOURNAL_DATA_SOURCE = '513ede69-60b8-45b3-ba9d-f101aa849ac3';
export const EO_DATA_SOURCE = '325a1d3c-1632-44d6-b146-606fe9fe9816';

export interface RichText {
  plain_text: string;
  href?: string | null;
  type?: string;
  annotations?: { bold?: boolean; italic?: boolean; code?: boolean; strikethrough?: boolean };
}

export interface NBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NBlock[];
  [key: string]: unknown;
}

export interface NPage {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  archived?: boolean;
  in_trash?: boolean;
  properties: Record<string, NProperty>;
}

export interface NProperty {
  type: string;
  title?: RichText[];
  rich_text?: RichText[];
  number?: number | null;
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  created_time?: string;
}

export interface TreeCache {
  get(key: string): Promise<NBlock[] | undefined>;
  set(key: string, value: NBlock[]): Promise<void>;
}

export interface NotionClientOptions {
  token: string;
  cache?: TreeCache;
  minIntervalMs?: number; // Notion allows ~3 requests/s on average
}

export class NotionClient {
  private token: string;
  private cache?: TreeCache;
  private minInterval: number;
  private nextSlot = 0;
  private syncedCache = new Map<string, Promise<NBlock[]>>();
  requests = 0;

  constructor(opts: NotionClientOptions) {
    if (!opts.token) throw new Error('NOTION_TOKEN is not set');
    this.token = opts.token;
    this.cache = opts.cache;
    this.minInterval = opts.minIntervalMs ?? 340;
  }

  private async throttle() {
    const now = Date.now();
    const wait = Math.max(0, this.nextSlot - now);
    this.nextSlot = Math.max(now, this.nextSlot) + this.minInterval;
    if (wait) await new Promise((r) => setTimeout(r, wait));
  }

  async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      await this.throttle();
      this.requests++;
      const res = await fetch(`https://api.notion.com/v1${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return (await res.json()) as T;
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error(`Notion ${method} ${path} failed: ${res.status} ${await res.text()}`);
    }
  }

  // All pages of a data source, optionally only those edited on or after `editedSince`.
  async queryDataSource(
    dataSourceId: string,
    opts: { editedSince?: string; limit?: number; newestFirst?: boolean } = {}
  ): Promise<NPage[]> {
    const pages: NPage[] = [];
    let cursor: string | undefined;
    do {
      const body: Record<string, unknown> = { page_size: Math.min(100, opts.limit ?? 100) };
      if (cursor) body.start_cursor = cursor;
      if (opts.editedSince) {
        body.filter = { timestamp: 'last_edited_time', last_edited_time: { on_or_after: opts.editedSince } };
      }
      if (opts.newestFirst) body.sorts = [{ timestamp: 'created_time', direction: 'descending' }];
      const res = await this.request<{ results: NPage[]; has_more: boolean; next_cursor: string | null }>(
        'POST',
        `/data_sources/${dataSourceId}/query`,
        body
      );
      pages.push(...res.results.filter((p) => !p.archived && !p.in_trash));
      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
      if (opts.limit && pages.length >= opts.limit) break;
    } while (cursor);
    return opts.limit ? pages.slice(0, opts.limit) : pages;
  }

  async getPage(pageId: string): Promise<NPage> {
    return this.request<NPage>('GET', `/pages/${pageId}`);
  }

  private async listChildren(blockId: string): Promise<NBlock[]> {
    const out: NBlock[] = [];
    let cursor: string | undefined;
    do {
      const qs = `page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
      const res = await this.request<{ results: NBlock[]; has_more: boolean; next_cursor: string | null }>(
        'GET',
        `/blocks/${blockId}/children?${qs}`
      );
      out.push(...res.results);
      cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    } while (cursor);
    return out;
  }

  // Recursive block tree. Child pages/databases are not descended into.
  // Synced-block references are skipped unless `resolveSynced` is set, in which
  // case each original is fetched once per client and reused.
  async getBlockTree(blockId: string, opts: { resolveSynced?: boolean; cacheKey?: string } = {}): Promise<NBlock[]> {
    if (opts.cacheKey && this.cache) {
      const hit = await this.cache.get(opts.cacheKey);
      if (hit) return hit;
    }
    const tree = await this.walk(blockId, !!opts.resolveSynced);
    if (opts.cacheKey && this.cache) await this.cache.set(opts.cacheKey, tree);
    return tree;
  }

  private async walk(blockId: string, resolveSynced: boolean): Promise<NBlock[]> {
    const blocks = await this.listChildren(blockId);
    for (const b of blocks) {
      if (b.type === 'child_page' || b.type === 'child_database') continue;
      if (b.type === 'synced_block') {
        const from = (b.synced_block as { synced_from?: { block_id?: string } | null } | undefined)?.synced_from;
        if (from?.block_id) {
          if (resolveSynced) {
            const id = from.block_id;
            if (!this.syncedCache.has(id)) this.syncedCache.set(id, this.walk(id, true).catch(() => []));
            b.children = await this.syncedCache.get(id)!;
          }
          continue;
        }
      }
      if (b.has_children) b.children = await this.walk(b.id, resolveSynced);
    }
    return blocks;
  }
}

// ---- Property helpers ----

export function plain(rt: RichText[] | undefined): string {
  return (rt ?? []).map((t) => t.plain_text).join('');
}

export function propText(page: NPage, name: string): string {
  const p = page.properties[name];
  if (!p) return '';
  if (p.type === 'title') return plain(p.title).trim();
  if (p.type === 'rich_text') return plain(p.rich_text).trim();
  if (p.type === 'select') return p.select?.name ?? '';
  return '';
}

export function propNumber(page: NPage, name: string): number | null {
  const p = page.properties[name];
  return p?.type === 'number' && typeof p.number === 'number' ? p.number : null;
}

export function propMulti(page: NPage, name: string): string[] {
  const p = page.properties[name];
  return p?.type === 'multi_select' ? (p.multi_select ?? []).map((o) => o.name) : [];
}

export function pageTitle(page: NPage): string {
  const t = Object.values(page.properties).find((p) => p.type === 'title');
  return t ? plain(t.title).trim() : '';
}
