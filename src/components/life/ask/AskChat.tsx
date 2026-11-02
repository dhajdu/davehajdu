'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { primaryButtonClass } from '@/components/life/ui';

type Source = { table: string; id: string; label: string; href: string };
type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; sources: Source[]; error?: boolean };

const STARTERS = [
  'When was my spinal fusion?',
  'How many times have I been to Australia?',
  'What word described October 2024?',
  'Do I sleep worse in months I travel more?',
];

export default function AskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    // Only successful turns go back as history.
    const history = messages
      .filter((m) => !(m.role === 'assistant' && m.error))
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/life/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error ?? `Request failed (${res.status}).`, sources: [], error: true },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer ?? '', sources: data.sources ?? [] }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Try again.', sources: [], error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="life-btn text-left font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="life-bubble is-user">
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className={`life-bubble${m.error ? ' is-error' : ''}`}
            >
              {m.content}
              {m.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 whitespace-normal">
                  {m.sources.map((s) => (
                    <Link
                      key={`${s.table}:${s.id}`}
                      href={s.href}
                      className="life-pill max-w-full truncate"
                      title={s.label}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="life-bubble is-busy">
            Looking through your records…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="life-ask-form"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          maxLength={2000}
          className="flex-1 min-w-0"
        />
        <button type="submit" disabled={busy || !input.trim()} className={primaryButtonClass}>
          Ask
        </button>
      </form>
    </div>
  );
}
