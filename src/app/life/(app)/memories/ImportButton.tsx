'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { primaryButtonClass } from '@/components/life/ui';

type Phase = 'idle' | 'picking' | 'importing' | 'done' | 'error';

// Opens Google's picker in a new tab, waits for the owner to finish picking,
// then pulls the photos in batches and refreshes the grid.
export default function ImportButton() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [note, setNote] = useState('');
  const stop = useRef(false);

  async function post<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
    return json as T;
  }

  async function start() {
    stop.current = false;
    // Open the tab synchronously so the browser does not block it as a popup.
    const tab = window.open('', '_blank');
    try {
      setPhase('picking');
      setNote('Opening Google Photos…');
      const { sessionId, pickerUri } = await post<{ sessionId: string; pickerUri: string }>('/api/life/memories/picker');
      if (tab) tab.location.href = pickerUri;
      else window.open(pickerUri, '_blank');
      setNote('Pick photos in the Google Photos tab, then press Done there.');

      let imported = 0;
      let skipped = 0;
      while (!stop.current) {
        const r = await post<{ ready: boolean; imported?: number; remaining?: number; skipped?: number; total?: number }>(
          '/api/life/memories/import',
          { sessionId }
        );
        if (!r.ready) {
          await new Promise((f) => setTimeout(f, 3000));
          continue;
        }
        setPhase('importing');
        imported += r.imported ?? 0;
        skipped = r.skipped ?? 0;
        setNote(`Imported ${imported} of ${r.total ?? imported}…`);
        if (!r.remaining) break;
      }
      if (stop.current) {
        setPhase('idle');
        setNote('');
        return;
      }
      setPhase('done');
      setNote(`Imported ${imported} photo${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} video${skipped === 1 ? '' : 's'}` : ''}.`);
      router.refresh();
    } catch (e) {
      tab?.close();
      setPhase('error');
      setNote(e instanceof Error ? e.message : 'Import failed.');
    }
  }

  const busy = phase === 'picking' || phase === 'importing';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {busy ? (
        <button type="button" className="life-btn" onClick={() => (stop.current = true)}>
          Cancel
        </button>
      ) : (
        <button type="button" className={primaryButtonClass} onClick={start}>
          Import from Google Photos
        </button>
      )}
      {note && <span className={`text-sm ${phase === 'error' ? 'text-magenta' : 'text-muted'}`}>{note}</span>}
    </div>
  );
}
