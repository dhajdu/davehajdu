import type { Status } from '@/lib/life/focus-parse';

const GLYPH: Record<Status, string> = { hit: '✓', missed: '×', partial: '–', open: '' };
const LABEL: Record<Status, string> = { hit: 'Hit', missed: 'Missed', partial: 'Partly', open: 'Open' };

// The ✅ ❌ 🟡 marks from the journal, drawn as one small circle.
export function StatusMark({ status }: { status: Status }) {
  return (
    <span className={`life-mark is-${status}`} role="img" aria-label={LABEL[status]} title={LABEL[status]}>
      {GLYPH[status]}
    </span>
  );
}

export const goalStatus = (s: 'open' | 'hit' | 'missed' | 'dropped'): Status => (s === 'dropped' ? 'open' : s);
