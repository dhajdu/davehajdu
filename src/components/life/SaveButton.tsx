'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

// A submit button that says what it is doing: "Saving…" while the action
// runs, then "Saved" for a moment. Errors never reach it (the error boundary
// takes over), so the end of a pending state means the save landed.
export function SaveButton({ className, children = 'Save' }: { className?: string; children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  const [prevPending, setPrevPending] = useState(false);
  const [saved, setSaved] = useState(false);

  // Derived during render: the moment pending ends, the save landed.
  if (prevPending !== pending) {
    setPrevPending(pending);
    if (prevPending && !pending) setSaved(true);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <button type="submit" disabled={pending} className={`${className ?? ''}${saved ? ' is-saved' : ''}`} aria-live="polite">
      {pending ? 'Saving…' : saved ? 'Saved ✓' : children}
    </button>
  );
}
