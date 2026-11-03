'use client';

import { useRef, useState, useTransition } from 'react';
import type { Track } from '@/lib/life/focus';
import { setOneThing } from '@/app/life/(app)/journal/[date]/actions';

// Today's One Thing on one track: click to edit, Enter or blur to save.
// Saving it empty clears it, and the rung goes back to its input.
export function LadderThing({ date, track, text }: { date: string; track: Track; text: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const save = () => {
    const next = input.current?.value.trim() ?? '';
    setEditing(false);
    if (next === text) return;
    start(async () => {
      const fd = new FormData();
      fd.set('date', date);
      fd.set('track', track);
      fd.set('one_thing', next);
      await setOneThing(fd);
    });
  };

  if (editing) {
    return (
      <input
        ref={input}
        className="life-rung-input is-big"
        defaultValue={text}
        maxLength={300}
        autoFocus
        aria-label="The one thing today"
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <button type="button" className={`life-rung-text life-rung-thing${pending ? ' is-pending' : ''}`} onClick={() => setEditing(true)} title="Click to edit">
      {text}
    </button>
  );
}
