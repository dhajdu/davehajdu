'use client';

import { buttonClass } from '@/components/life/ui';

export default function LifeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="life-card max-w-xl">
      <h1 className="life-card-title">Something went wrong</h1>
      <p className="text-sm text-body-text mb-4">{error.message || 'The action could not be completed.'}</p>
      <button type="button" onClick={reset} className={buttonClass}>
        Try again
      </button>
    </div>
  );
}
