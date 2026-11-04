'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const lifeInputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-blue';

// A password field with the eye toggle. Every password input in /life uses this.
export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${lifeInputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-navy"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
