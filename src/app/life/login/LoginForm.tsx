'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUp, Check } from 'lucide-react';
import { createLifeBrowserClient } from '@/lib/life/supabase-browser';
import PasswordInput, { lifeInputClass as inputClass } from '@/components/life/PasswordInput';

type Step = 'loading' | 'password' | 'email' | 'code' | 'done';
type Notice = 'link' | 'signed_out' | null;

// The mark: the ladder, with the one thing at the top of it.
function Mark() {
  return (
    <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--life-mint)" />
      <path d="M11.5 9.5v14M20.5 9.5v14" stroke="var(--life-navy)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11.5 15h9M11.5 20.5h9" stroke="var(--life-navy)" strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
      <circle cx="16" cy="9.5" r="2.7" fill="var(--life-navy)" />
    </svg>
  );
}

// Where the dot sits for each rung reached: the ground, three rungs, the top.
const DOT_BOTTOM = [0, 29, 119, 209, 299];
const ICT = 'Asia/Ho_Chi_Minh';

export default function LoginForm() {
  const [supabase] = useState(() => createLifeBrowserClient());
  const [step, setStep] = useState<Step>('loading');
  const [notice, setNotice] = useState<Notice>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        window.location.assign('/life/journal');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'link') setNotice('link');
      else if (params.has('signed_out')) setNotice('signed_out');
      setNow(new Date());
      setStep('password');
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

  // The dot reaches the top, then Today opens.
  function enter() {
    setStep('done');
    window.setTimeout(() => window.location.assign('/life/journal'), 900);
  }

  const signInWithPassword = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Wrong email or password.');
      enter();
    });

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
      enter();
    });

  const submit = step === 'password' ? signInWithPassword : step === 'email' ? sendCode : verifyEmail;

  function switchTo(next: Step) {
    setError('');
    setNotice(null);
    setStep(next);
  }

  const hasEmail = email.includes('@');
  const viaLink = step === 'email' || step === 'code';
  const level =
    step === 'done' ? 4
    : step === 'code' ? 2
    : step === 'email' ? (hasEmail ? 1 : 0)
    : step === 'password' ? (busy ? 3 : hasEmail ? (password ? 2 : 1) : 0)
    : 0;
  const rungs = viaLink ? ['Email', 'Check your inbox', 'Open the link'] : ['Email', 'Password', 'Sign in'];

  const hour = now ? Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: ICT }).format(now)) : 0;
  const greeting = `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, Dave.`;
  const eyebrow = step === 'code' ? 'Link sent' : now ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: ICT }) : '';
  const title =
    step === 'done' ? 'You’re in, Dave.'
    : step === 'code' ? 'Check your inbox.'
    : step === 'email' ? 'No password needed.'
    : notice === 'link' ? 'That link ran out.'
    : notice === 'signed_out' ? 'See you tomorrow, Dave.'
    : greeting;
  const [caption, captionSub] =
    step === 'done' ? ['Top of the ladder.', 'Now, the one thing.']
    : step === 'code' ? ['Halfway up.', 'One more rung and you’re in.']
    : notice === 'link' ? ['Back on the ground.', 'The ladder is still here.']
    : notice === 'signed_out' ? ['Done for the day.', 'The ladder will be here tomorrow.']
    : ['One thing today.', 'Everything else gets easier.'];

  return (
    <div className="life-login">
      <div className="life-login-panel">
        <div className="life-login-brand">
          <Mark />
          <span>/life</span>
        </div>
        <div className={`life-climb${level === 4 ? ' is-top' : ''}`} aria-hidden>
          <span className="life-climb-rail is-left" />
          <span className="life-climb-rail is-right" />
          {rungs.map((label, i) => (
            <span key={i} className={`life-climb-rung is-${i + 1}${level > i ? ' is-lit' : ''}`}>
              <span>{label}</span>
            </span>
          ))}
          <span className="life-climb-goal" />
          <span className="life-climb-dot" style={{ bottom: DOT_BOTTOM[level] }} />
          <span className="life-climb-top">Today’s one thing</span>
        </div>
        <p className="life-login-caption">
          {caption}
          <span>{captionSub}</span>
        </p>
      </div>

      <div className="life-login-main">
        {step === 'loading' && <p className="text-sm text-muted">Checking session…</p>}

        {step === 'done' && (
          <div className="life-login-form" role="status">
            <span className="life-login-check"><Check size={30} strokeWidth={3} aria-hidden /></span>
            <div>
              <h1 className="life-login-title">{title}</h1>
              <p className="life-login-sub">Opening Today.</p>
            </div>
            <div className="life-login-progress"><span /></div>
          </div>
        )}

        {(step === 'password' || step === 'email' || step === 'code') && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="life-login-form"
          >
            <div>
              <div className="life-login-eyebrow">{eyebrow}</div>
              <h1 className="life-login-title">{title}</h1>
              {step === 'password' && !notice && <p className="life-login-sub">Private. Sign in to pick up where you left off.</p>}
              {step === 'email' && <p className="life-login-sub">Enter your email and we’ll send a one-time sign-in link.</p>}
              {step === 'code' && (
                <p className="life-login-sub">
                  We sent a sign-in link to <strong>{email}</strong>. Click it and you’re in.
                </p>
              )}
            </div>

            {step === 'password' && notice === 'link' && (
              <p className="life-login-note is-error" role="alert">The sign-in link expired or was already used. Sign in with your password, or send a new link.</p>
            )}
            {step === 'password' && notice === 'signed_out' && (
              <p className="life-login-note is-ok" role="status">You’re signed out.</p>
            )}

            {(step === 'password' || step === 'email') && (
              <div className="life-login-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
            )}

            {step === 'password' && (
              <div className="life-login-field">
                <label htmlFor="password">Password</label>
                <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
            )}

            {step === 'code' && (
              <div className="life-login-field">
                <label htmlFor="code">Got a 6-digit code instead? Enter it here.</label>
                <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} life-login-code`} />
              </div>
            )}

            {error && <p className="life-login-note is-error" role="alert">{error}</p>}

            <button type="submit" disabled={busy} className="life-login-submit">
              {busy ? 'Working…' : step === 'password' ? (notice === 'signed_out' ? 'Sign back in' : 'Sign in') : step === 'email' ? 'Send link' : 'Verify'}
              {!busy && <ArrowUp size={16} strokeWidth={2.4} aria-hidden />}
            </button>

            {step === 'password' && (
              <button type="button" className="life-login-link" onClick={() => switchTo('email')}>
                {notice === 'link' ? 'Send a new link' : 'Email me a sign-in link instead'}
              </button>
            )}
            {step === 'email' && (
              <button type="button" className="life-login-link" onClick={() => switchTo('password')}>
                Sign in with a password instead
              </button>
            )}
            {step === 'code' && (
              <div className="life-login-links">
                <button type="button" className="life-login-link" onClick={() => switchTo('email')}>Use a different email</button>
                <button type="button" className="life-login-link" disabled={busy} onClick={sendCode}>Send a new link</button>
              </div>
            )}

            {step !== 'code' && <Link href="/" className="life-login-home">Back to davehajdu.com</Link>}
          </form>
        )}
      </div>
    </div>
  );
}
