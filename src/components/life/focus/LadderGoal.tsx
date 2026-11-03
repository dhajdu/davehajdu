'use client';

import { useRef, useState, useTransition } from 'react';
import type { GoalRow } from '@/lib/life/focus';
import { renameLongGoal, setLongGoalStatus } from '@/app/life/(app)/goals/actions';
import { GOAL_WORD, StatusMark, goalStatus, type GoalStatus } from './StatusMark';

const STATES: GoalStatus[] = ['open', 'behind', 'hit', 'missed'];

// A goal line on the ladder: click the text to rename it, hover for On track /
// Behind / Achieved / Missed, or the × to remove it.
export function LadderGoal({ goal }: { goal: GoalRow }) {
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

  return (
    <div className={`life-rung-item life-rung-goal is-${goalStatus(status)}${goal.focus ? ' is-focus' : ''}${pending ? ' is-pending' : ''}`}>
      <StatusMark status={goalStatus(status)} />
      {editing ? (
        <input
          ref={input}
          className="life-rung-input"
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
        <button type="button" className="life-rung-goal-text" onClick={() => setEditing(true)} title="Click to edit">
          {goal.title}
        </button>
      )}
      {!editing && (
        <span className="life-rung-goal-actions">
          {STATES.filter((s) => s !== status).map((s) => (
            <button key={s} type="button" className={`is-${s}`} disabled={pending} onClick={() => send(setLongGoalStatus, { status: s })}>
              {GOAL_WORD[s]}
            </button>
          ))}
          <button type="button" className="life-rung-goal-x" onClick={remove} aria-label="Remove" title="Remove">
            ×
          </button>
        </span>
      )}
    </div>
  );
}
