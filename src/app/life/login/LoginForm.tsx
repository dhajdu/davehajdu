'use client';

import { useEffect, useState } from 'react';
import { createLifeBrowserClient } from '@/lib/life/supabase-browser';
import { primaryButtonClass } from '@/components/life/ui';

type Step = 'loading' | 'email' | 'code' | 'enroll' | 'challenge';

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:border-blue';

export default function LoginForm() {
  const [supabase] = useState(() => createLifeBrowserClient());
  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // After the email code, decide between TOTP enroll and challenge.
  async function startMfa() {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2') return window.location.assign('/life');

    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const verified = data.totp.find((f) => f.status === 'verified');
    if (verified) {
      setFactorId(verified.id);
      setStep('challenge');
      return;
    }
    // Clear half-finished enrollments so enroll() does not collide.
    for (const f of data.all.filter((f) => f.factor_type === 'totp' && f.status !== 'verified')) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: '/life' });
    if (enrollError) throw enrollError;
    setFactorId(enrolled.id);
    setQr(enrolled.totp.qr_code);
    setSecret(enrolled.totp.secret);
    setStep('enroll');
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setStep('email');
      try {
        await startMfa();
      } catch {
        setStep('email');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setCode('');
      await startMfa();
    });

  const verifyTotp = () =>
    run(async () => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) throw new Error('That authenticator code did not work.');
      window.location.assign('/life');
    });

  const submit = step === 'email' ? sendCode : step === 'code' ? verifyEmail : verifyTotp;

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
          <p className="text-xs text-muted">We will email you a sign-in link and a 6-digit code.</p>
        </>
      )}

      {step === 'code' && (
        <>
          <label className="block text-sm font-semibold text-navy" htmlFor="code">Code sent to {email}</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} tracking-widest`} />
          <button type="button" className="text-xs text-blue" onClick={() => setStep('email')}>Use a different email</button>
        </>
      )}

      {step === 'enroll' && (
        <>
          <p className="text-sm text-body-text">Scan this with your authenticator app, then enter the 6-digit code it shows.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="Authenticator QR code" width={180} height={180} className="border border-border rounded-lg" />}
          <p className="text-xs text-muted break-all">Or enter this key: <span className="font-mono text-navy">{secret}</span></p>
        </>
      )}

      {(step === 'enroll' || step === 'challenge') && (
        <>
          <label className="block text-sm font-semibold text-navy" htmlFor="totp">Authenticator code</label>
          <input id="totp" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} tracking-widest`} />
        </>
      )}

      {error && <p className="text-sm text-magenta">{error}</p>}

      {step !== 'loading' && (
        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full py-2 text-sm`}>
          {busy ? 'Working…' : step === 'email' ? 'Send code' : 'Verify'}
        </button>
      )}
    </form>
  );
}
