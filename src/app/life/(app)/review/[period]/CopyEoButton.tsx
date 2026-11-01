'use client';

import { useState } from 'react';
import { buttonClass } from '@/components/life/ui';

export default function CopyEoButton({ markdown }: { markdown: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(markdown);
          setState('copied');
        } catch {
          setState('failed');
        }
        setTimeout(() => setState('idle'), 2000);
      }}
    >
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy as EO update'}
    </button>
  );
}
