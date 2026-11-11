'use client';

import { useRef, useState } from 'react';

// The day's fields live in several cards, so there is no one Save button: the
// form saves when focus leaves a field that changed. The action is called
// directly rather than through `action=`, so React does not reset fields the
// owner is still typing in when an earlier save lands.
export function AutoSaveForm({ action, className, children }: { action: (fd: FormData) => Promise<void>; className?: string; children: React.ReactNode }) {
  const form = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);
  const busy = useRef(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'invalid' | 'error'>('idle');

  async function save() {
    const el = form.current;
    if (!el || !dirty.current || busy.current) return;
    if (!el.checkValidity()) {
      setStatus('invalid');
      return;
    }
    dirty.current = false;
    busy.current = true;
    setStatus('saving');
    let ok = true;
    try {
      await action(new FormData(el));
      setStatus('saved');
    } catch {
      ok = false;
      dirty.current = true;
      setStatus('error');
    } finally {
      busy.current = false;
    }
    // Something changed while that save was in flight and focus has already left the form.
    if (ok && dirty.current && !el.contains(document.activeElement)) save();
  }

  return (
    <form
      ref={form}
      className={className}
      onInput={() => {
        dirty.current = true;
      }}
      onBlur={save}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {children}
      <p className={`life-today-status${status === 'error' || status === 'invalid' ? ' is-error' : ''}`} aria-live="polite">
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : status === 'invalid' ? 'Check the numbers, then it saves.' : status === 'error' ? 'Could not save. Change a field to try again.' : 'Saves as you go'}
      </p>
    </form>
  );
}
