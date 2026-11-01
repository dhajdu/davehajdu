'use client';

import { useEffect, useState } from 'react';
import { createLifeBrowserClient } from '@/lib/life/supabase-browser';
import { primaryButtonClass } from '@/components/life/ui';

type Step = 'loading' | 'email' | 'code';

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-blue';

export default function LoginForm() {
  const [supabase] = useState(() => createLifeBrowserClient());
  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.assign('/life');
      else setStep('email');
    });
  }, [supabase]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/life/auth/callback` },
      });
      if (error) throw new Error('This email cannot sign in to /life.');
      setCode('');
      setStep('code');
    });

  const verifyEmail = () =>
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) throw new Error('That code did not work. Check it or send a new one.');
      window.location.assign('/life');
    });

  const submit = step === 'email' ? sendCode : verifyEmail;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      {step === 'loading' && <p className="text-sm text-muted">Checking session…</p>}

      {step === 'email' && (
        <>
          <label className="block text-sm font-semibold text-navy" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <p className="text-xs text-muted">We will email you a sign-in link.</p>
        </>
      )}

      {step === 'code' && (
        <>
          <p className="text-sm text-body-text">Check {email} and click the sign-in link. If the email shows a 6-digit code instead, enter it here.</p>
          <label className="block text-sm font-semibold text-navy" htmlFor="code">Code</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} tracking-widest`} />
          <button type="button" className="text-xs text-blue" onClick={() => setStep('email')}>Use a different email</button>
        </>
      )}

      {error && <p className="text-sm text-magenta">{error}</p>}

      {step !== 'loading' && (
        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full py-2 text-sm`}>
          {busy ? 'Working…' : step === 'email' ? 'Send link' : 'Verify'}
        </button>
      )}
    </form>
  );
}
