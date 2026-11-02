'use client';

import { useRef, useState, useTransition } from 'react';
import type { GoalRow } from '@/lib/life/focus';
import { formatValue } from '@/lib/life/metrics';
import { GOAL_WORD, type GoalStatus } from './StatusMark';

type Action = (formData: FormData) => Promise<void>;
const STATES: GoalStatus[] = ['open', 'behind', 'hit'];

// A five-year vision goal: click the text to rename, pick On track / Behind /
// Achieved, or the × in the corner to remove it.
export function VisionCard({ goal, rename, setStatus }: { goal: GoalRow; rename: Action; setStatus: Action }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const status = goal.status as GoalStatus;

  const send = (action: Action, fields: Record<string, string>) =>
    start(async () => {
      const fd = new FormData();
      fd.set('goal_id', goal.id);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      await action(fd);
    });

  const save = () => {
    const title = input.current?.value.trim();
    setEditing(false);
    if (title && title !== goal.title) send(rename, { title });
  };

  const remove = () => {
    if (window.confirm(`Remove "${goal.title}"?`)) send(setStatus, { status: 'dropped' });
  };

  return (
    <li className={`life-vision-card is-${goal.area?.slug ?? 'direction'} is-${status}${pending ? ' is-pending' : ''}`}>
      <button type="button" className="life-vision-x" onClick={remove} aria-label="Remove" title="Remove">
        ×
      </button>
      <span className="life-vision-area">{goal.area?.name ?? 'Direction'}</span>
      {editing ? (
        <input
          ref={input}
          className="life-vision-input"
          defaultValue={goal.title}
          maxLength={200}
          autoFocus
          aria-label="Title"
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button type="button" className="life-vision-text" onClick={() => setEditing(true)} title="Click to rename">
          {goal.title}
        </button>
      )}
      {goal.metric && goal.target_value !== null && (
        <p className="life-goal-meta">
          {goal.metric.name} {formatValue(Number(goal.target_value), goal.metric.unit)}
        </p>
      )}
      <div className="life-vision-state" role="radiogroup" aria-label="Progress">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            className={`is-${s}`}
            disabled={pending}
            onClick={() => status !== s && send(setStatus, { status: s })}
          >
            {GOAL_WORD[s]}
          </button>
        ))}
      </div>
    </li>
  );
}
