'use client';
import { useState } from 'react';

// Confirmation code that copies to the clipboard on tap.
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy confirmation code ${code}`}
      className="inline-flex items-center gap-1.5 min-h-8 font-mono text-xs font-semibold text-navy bg-light-gray border border-border rounded-md px-2 py-1 active:bg-mint"
    >
      {code}
      <span className="font-sans font-normal text-muted">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
