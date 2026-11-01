import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Chip, EmptyState, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { formatDate, getAreas } from '@/lib/life/metrics';

const PAGE = 50;
type Zoom = 'decade' | 'year' | 'month';

type Item = {
  key: string;
  date: string;
  end?: string | null;
  areaId: string | null;
  kind: string;
  title: string;
  href?: string;
};

const KIND_LABEL: Record<string, string> = {
  journal: 'Journal',
  eo_update: 'EO update',
  learning: 'Learning',
  presentation: 'Presentation',
  note: 'Note',
  trip: 'Trip',
};

function one(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : undefined;
}

function groupKey(date: string, zoom: Zoom) {
  if (zoom === 'decade') return `${date.slice(0, 3)}0`;
  if (zoom === 'year') return date.slice(0, 4);
  return date.slice(0, 7);
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[]; zoom?: string | string[]; at?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const zoomParam = one(sp.zoom);
  const zoom: Zoom = zoomParam === 'year' || zoomParam === 'month' ? zoomParam : 'decade';
  const atRaw = one(sp.at);
  const at = atRaw && /^\d{4}$/.test(atRaw) ? atRaw : undefined;
  const q = one(sp.q)?.trim().slice(0, 200) || undefined;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const areaSlug = one(sp.area);

  const areas = await getAreas(supabase);
  const area = areas.find((a) => a.slug === areaSlug);
  const areaName = new Map(areas.map((a) => [a.id, a.name]));

  // Window: Year zoom inside a decade, Month zoom inside a year.
  let from: string | null = null;
  let to: string | null = null;
  if (at && zoom === 'year') {
    const d = `${at.slice(0, 3)}0`;
    from = `${d}-01-01`;
    to = `${Number(d) + 9}-12-31`;
  } else if (at && zoom === 'month') {
    from = `${at}-01-01`;
    to = `${at}-12-31`;
  }

  const limit = page * PAGE + 1;

  let recordsQ = supabase.from('records').select('id, area_id, kind, title, started_on, ended_on').not('started_on', 'is', null);
  if (area) recordsQ = recordsQ.eq('area_id', area.id);
  if (from) recordsQ = recordsQ.gte('started_on', from);
  if (to) recordsQ = recordsQ.lte('started_on', to);
  if (q) recordsQ = recordsQ.ilike('title', `%${q}%`);

  const includeTrips = !area || area.slug === 'places';
  let tripsQ = supabase.from('trips').select('id, title, start_on, end_on');
  if (from) tripsQ = tripsQ.gte('start_on', from);
  if (to) tripsQ = tripsQ.lte('start_on', to);
  if (q) tripsQ = tripsQ.ilike('title', `%${q}%`);

  let entriesQ = supabase.from('entries').select('id, area_id, kind, entry_date, title');
  entriesQ = q
    ? entriesQ.neq('kind', 'reference').textSearch('search', q, { type: 'websearch', config: 'english' })
    : entriesQ.in('kind', ['journal', 'eo_update']);
  if (area) entriesQ = entriesQ.eq('area_id', area.id);
  if (from) entriesQ = entriesQ.gte('entry_date', from);
  if (to) entriesQ = entriesQ.lte('entry_date', to);

  const [recordsRes, tripsRes, entriesRes] = await Promise.all([
    recordsQ.order('started_on', { ascending: false }).limit(limit),
    includeTrips ? tripsQ.order('start_on', { ascending: false }).limit(limit) : Promise.resolve({ data: [], error: null }),
    entriesQ.order('entry_date', { ascending: false }).limit(limit),
  ]);
  const error = recordsRes.error ?? tripsRes.error ?? entriesRes.error;

  const items: Item[] = [
    ...((recordsRes.data ?? []) as { id: string; area_id: string; kind: string; title: string; started_on: string; ended_on: string | null }[]).map((r) => ({
      key: `r-${r.id}`,
      date: r.started_on,
      end: r.ended_on,
      areaId: r.area_id,
      kind: r.kind,
      title: r.title,
    })),
    ...((tripsRes.data ?? []) as { id: string; title: string; start_on: string; end_on: string | null }[]).map((t) => ({
      key: `t-${t.id}`,
      date: t.start_on,
      end: t.end_on,
      areaId: areas.find((a) => a.slug === 'places')?.id ?? null,
      kind: 'trip',
      title: t.title,
      href: `/life/travel/${t.id}`,
    })),
    ...((entriesRes.data ?? []) as { id: string; area_id: string | null; kind: string; entry_date: string; title: string | null }[]).map((e) => ({
      key: `e-${e.id}`,
      date: e.entry_date,
      areaId: e.area_id,
      kind: e.kind,
      title: e.title || `${KIND_LABEL[e.kind] ?? e.kind}, ${formatDate(e.entry_date)}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));

  const pageItems = items.slice((page - 1) * PAGE, page * PAGE);
  const hasMore = items.length > page * PAGE;

  const groups: { key: string; items: Item[] }[] = [];
  for (const it of pageItems) {
    const k = groupKey(it.date, zoom);
    if (groups[groups.length - 1]?.key !== k) groups.push({ key: k, items: [] });
    groups[groups.length - 1].items.push(it);
  }

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { area: area?.slug, zoom: zoom === 'decade' ? undefined : zoom, at, q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/life/timeline${s ? `?${s}` : ''}`;
  };

  const groupLabel = (k: string) => {
    if (zoom === 'decade') return `${k}s`;
    if (zoom === 'year') return k;
    return formatDate(`${k}-01`, { month: 'long', year: 'numeric' });
  };
  const groupHref = (k: string) => {
    if (zoom === 'decade') return href({ zoom: 'year', at: k, page: undefined });
    if (zoom === 'year') return href({ zoom: 'month', at: k, page: undefined });
    return `/life?month=${k}`;
  };

  const windowLabel = from && to ? (zoom === 'year' ? `${from.slice(0, 4)}s` : from.slice(0, 4)) : null;

  const chip = (active: boolean) =>
    `text-xs font-semibold px-2.5 py-1 rounded-full border ${active ? 'bg-navy border-navy text-white' : 'bg-white border-border text-navy'}`;

  return (
    <div className="max-w-4xl">
      <PageHeader title="Timeline" subtitle={windowLabel ? `Showing ${windowLabel}` : 'Everything, newest first'} />

      <form action="/life/timeline" className="flex gap-2 mb-4">
        {area && <input type="hidden" name="area" value={area.slug} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search your life…"
          className="flex-1 min-w-0 text-sm border border-border rounded-lg px-3 py-1.5 text-navy"
        />
        <button type="submit" className={primaryButtonClass}>Search</button>
        {q && <Link href={href({ q: undefined, page: undefined })} className={buttonClass}>Clear</Link>}
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Link href={href({ area: undefined, page: undefined })} className={chip(!area)}>All</Link>
        {areas.map((a) => (
          <Link key={a.id} href={href({ area: a.slug, page: undefined })} className={chip(area?.id === a.id)}>
            {a.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link href={href({ zoom: undefined, at: undefined, page: undefined })} className={chip(zoom === 'decade')}>Decade</Link>
        <Link href={href({ zoom: 'year', at: at ? `${at.slice(0, 3)}0` : undefined, page: undefined })} className={chip(zoom === 'year')}>Year</Link>
        <Link href={href({ zoom: 'month', at: at ?? undefined, page: undefined })} className={chip(zoom === 'month')}>Month</Link>
        {at && (
          <Link href={href({ at: undefined, page: undefined })} className="text-xs text-blue font-semibold">
            Show all years
          </Link>
        )}
      </div>

      {error ? (
        <EmptyState>Could not load the timeline: {error.message}</EmptyState>
      ) : groups.length === 0 ? (
        <EmptyState>{q ? `Nothing matches "${q}".` : 'Nothing on the timeline yet.'}</EmptyState>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="text-sm font-bold text-navy mb-2">
                <Link href={groupHref(g.key)} className="hover:text-blue">{groupLabel(g.key)}</Link>
              </h2>
              <ul className="border border-border rounded-xl divide-y divide-border">
                {g.items.map((it) => (
                  <li key={it.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
                    <span className="text-xs text-muted w-full sm:w-36 shrink-0">
                      {formatDate(it.date)}
                      {it.end && it.end !== it.date ? ` to ${formatDate(it.end, { month: 'short', day: 'numeric' })}` : ''}
                    </span>
                    <span className="flex-1 min-w-0 text-sm">
                      {it.href ? (
                        <Link href={it.href} className="font-semibold text-navy hover:text-blue">{it.title}</Link>
                      ) : (
                        <span className="font-semibold text-navy">{it.title}</span>
                      )}
                    </span>
                    <span className="flex gap-1">
                      {it.areaId && areaName.get(it.areaId) && <Chip>{areaName.get(it.areaId)}</Chip>}
                      <Chip tone={it.kind === 'trip' ? 'mint' : it.kind === 'eo_update' ? 'blue' : 'gray'}>
                        {KIND_LABEL[it.kind] ?? it.kind}
                      </Chip>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-between mt-6">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className={buttonClass}>Newer</Link> : <span />}
          {hasMore && <Link href={href({ page: String(page + 1) })} className={buttonClass}>Older</Link>}
        </div>
      )}
    </div>
  );
}
