'use client';

import { useRef, useState, useTransition } from 'react';
import type { GoalRow } from '@/lib/life/focus';
import { formatValue } from '@/lib/life/format';
import { renameLongGoal, setLongGoalStatus } from '@/app/life/(app)/goals/actions';
import { GOAL_WORD, type GoalStatus } from '@/components/life/focus/StatusMark';

// A goal on the board: the track as its colour, click the title to rename,
// pick a state, or the × to remove it. One card for every horizon.
export function GoalCard({ goal, states = ['open', 'behind', 'hit'] }: { goal: GoalRow; states?: GoalStatus[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const status = goal.status as GoalStatus;

  const send = (action: (fd: FormData) => Promise<void>, fields: Record<string, string>) =>
    start(async () => {
      const fd = new FormData();
      fd.set('goal_id', goal.id);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      await action(fd);
    });

  const save = () => {
    const title = input.current?.value.trim();
    setEditing(false);
    if (title && title !== goal.title) send(renameLongGoal, { title });
  };

  const remove = () => {
    if (window.confirm(`Remove "${goal.title}"?`)) send(setLongGoalStatus, { status: 'dropped' });
  };

  const shown = states.includes(status) ? states : [...states, status];

  return (
    <li className={`life-goal-card is-${goal.track} is-${status}${goal.focus ? ' is-focus' : ''}${pending ? ' is-pending' : ''}`}>
      <button type="button" className="life-goal-card-x" onClick={remove} aria-label="Remove" title="Remove">
        ×
      </button>
      <span className="life-goal-card-track">
        {goal.track === 'health' ? 'Health' : 'Business'}
        {goal.focus && <em> · The one thing</em>}
        {goal.area && <small> · {goal.area.name}</small>}
      </span>
      {editing ? (
        <input
          ref={input}
          className="life-goal-card-input"
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
        <button type="button" className="life-goal-card-title" onClick={() => setEditing(true)} title="Click to rename">
          {goal.title}
        </button>
      )}
      {goal.metric && goal.target_value !== null && (
        <p className="life-goal-meta">
          {goal.metric.name} {formatValue(Number(goal.target_value), goal.metric.unit)}
        </p>
      )}
      <div className="life-goal-card-state" role="radiogroup" aria-label="Progress">
        {shown.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={status === s} className={`is-${s}`} disabled={pending} onClick={() => status !== s && send(setLongGoalStatus, { status: s })}>
            {GOAL_WORD[s]}
          </button>
        ))}
      </div>
    </li>
  );
}
