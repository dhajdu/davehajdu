'use client';

import { useState } from 'react';
import { createLifeBrowserClient } from '@/lib/life/supabase-browser';
import { primaryButtonClass } from '@/components/life/ui';
import PasswordInput from '@/components/life/PasswordInput';

const MIN_LENGTH = 10;

export default function ChangePasswordForm({ email }: { email: string }) {
  const [supabase] = useState(() => createLifeBrowserClient());
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    if (next === current) {
      setError('Pick a password you have not used here before.');
      return;
    }
    setBusy(true);
    try {
      // Re-check the current password first, so a left-open laptop cannot change it.
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) throw new Error('The current password is wrong.');
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-navy" htmlFor="current-password">Current password</label>
        <PasswordInput id="current-password" value={current} onChange={setCurrent} autoComplete="current-password" />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-navy" htmlFor="new-password">New password</label>
        <PasswordInput id="new-password" value={next} onChange={setNext} autoComplete="new-password" minLength={MIN_LENGTH} />
        <p className="text-xs text-muted">At least {MIN_LENGTH} characters.</p>
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-navy" htmlFor="confirm-password">Confirm new password</label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={MIN_LENGTH} />
      </div>

      {error && <p className="text-sm text-magenta">{error}</p>}
      {done && <p className="text-sm text-navy">Password updated. Use the new one next time you sign in.</p>}

      <button type="submit" disabled={busy} className={`${primaryButtonClass} py-2 text-sm`}>
        {busy ? 'Working…' : 'Change password'}
      </button>
    </form>
  );
}
