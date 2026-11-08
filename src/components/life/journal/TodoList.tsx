'use client';

import { useOptimistic, useState, useTransition, type DragEvent } from 'react';
import { ArrowUp, GripVertical } from 'lucide-react';
import type { TodoNode, Todo } from '@/lib/life/journal';
import { formatDate } from '@/lib/life/format';
import { Chip } from '@/components/life/ui';
import { addTodo, dropTodo, renameTodo, reorderTodos, setTodoDone } from '@/app/life/(app)/journal/[date]/actions';

// What is open on this day and what got done. Every control is a form, so it
// works without JavaScript and on a phone with a flaky connection. The open
// list is draggable: items above the line are for today, the rest can wait.
// Ticking a box pops it at once, before the server answers; the item then
// arrives in the Done list with a short glow (`fresh`).
function Row({ t, date, done, child = false, today = false, fresh = false, handle, extra }: { t: Todo; date: string; done: boolean; child?: boolean; today?: boolean; fresh?: boolean; handle?: React.ReactNode; extra?: React.ReactNode }) {
  const [ticking, setTicking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useOptimistic(t.title);
  const hit = done || ticking;
  async function rename(fd: FormData) {
    const next = String(fd.get('title') ?? '').trim();
    if (!next || next === t.title) return;
    setTitle(next);
    await renameTodo(fd);
  }
  return (
    <li className={`life-todo${child ? ' is-child' : ''}${hit ? ' is-done' : ''}${fresh ? ' is-new' : ''}`}>
      {handle}
      <form action={setTodoDone} className="life-todo-check">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="done" value={done ? '0' : '1'} />
        <button type="submit" onClick={() => !done && setTicking(true)} className={`life-mark${hit ? ' is-hit' : ''}${ticking ? ' is-pop' : ''}`} aria-label={done ? 'Mark not done' : 'Mark done'} title={done ? 'Not done' : 'Done'}>
          {hit ? '✓' : ''}
        </button>
      </form>
      <span className="life-todo-title">
        {editing ? (
          <form action={rename} onSubmit={() => setEditing(false)} className="life-todo-edit">
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="id" value={t.id} />
            <input
              name="title"
              defaultValue={title}
              required
              maxLength={300}
              autoFocus
              autoComplete="off"
              aria-label="Edit item"
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => {
                if (e.key !== 'Escape') return;
                e.currentTarget.value = title; // a blur on the way out then saves nothing
                setEditing(false);
              }}
            />
          </form>
        ) : (
          <button type="button" className="life-todo-text" onClick={() => setEditing(true)} title="Click to edit">{title}</button>
        )}
        {today && <Chip tone="mint">Today</Chip>}
        {!child && !hit && <small>Started {t.added_on === date ? 'today' : formatDate(t.added_on, { month: 'short', day: 'numeric' })}</small>}
      </span>
      {extra}
      {!done && (
        <form action={dropTodo}>
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="id" value={t.id} />
          <button type="submit" className="life-todo-x" aria-label="Drop" title="Drop">×</button>
        </form>
      )}
    </li>
  );
}

function AddForm({ date, parent, placeholder }: { date: string; parent?: string; placeholder: string }) {
  return (
    <form action={addTodo} className="life-todo-add">
      <input type="hidden" name="date" value={date} />
      {parent && <input type="hidden" name="parent_id" value={parent} />}
      <input name="title" required maxLength={300} placeholder={placeholder} autoComplete="off" />
      <button type="submit" className="life-btn">Add</button>
    </form>
  );
}

const LINE = '__line__';

// Root ids in list order, with the line after the items planned for this day.
function initialOrder(open: TodoNode[], date: string): string[] {
  const today = (n: TodoNode) => n.planned_on !== null && n.planned_on <= date;
  return [...open.filter(today).map((n) => n.id), LINE, ...open.filter((n) => !today(n)).map((n) => n.id)];
}

function moveKey(order: string[], key: string, overKey: string, before: boolean): string[] {
  const without = order.filter((k) => k !== key);
  const at = without.indexOf(overKey) + (before ? 0 : 1);
  const next = [...without.slice(0, at), key, ...without.slice(at)];
  return next.every((k, i) => k === order[i]) ? order : next;
}

function OpenList({ date, open }: { date: string; open: TodoNode[] }) {
  const signature = open.map((n) => `${n.id}:${n.planned_on ?? ''}:${n.sort_order}`).join('|');
  const [seen, setSeen] = useState(signature);
  const [order, setOrder] = useState(() => initialOrder(open, date));
  if (seen !== signature) {
    // The server sent a new list (an add, a tick, a drop): start from it.
    setSeen(signature);
    setOrder(initialOrder(open, date));
  }
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const byId = new Map(open.map((n) => [n.id, n]));
  const lineAt = order.indexOf(LINE);

  function onDragStart(e: DragEvent<HTMLElement>, key: string) {
    setDragging(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    const row = e.currentTarget.closest('li');
    if (row) e.dataTransfer.setDragImage(row, 24, 16);
  }
  function onDragOver(e: DragEvent<HTMLLIElement>, overKey: string) {
    e.preventDefault();
    if (!dragging || dragging === overKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setOrder((o) => moveKey(o, dragging, overKey, before));
  }
  function persist(o: string[]) {
    startTransition(() => reorderTodos(date, o.filter((k) => k !== LINE), o.indexOf(LINE)));
  }
  // Every dragover re-rendered with the latest order before dragend fires, so `order` is current here.
  function onDragEnd() {
    if (!dragging) return;
    setDragging(null);
    persist(order);
  }
  // The up arrow: the item joins the end of today's list, just above the line.
  function moveToToday(id: string) {
    const next = moveKey(order, id, LINE, true);
    setOrder(next);
    persist(next);
  }

  return (
    <ul className="life-todo-list" onDrop={(e) => e.preventDefault()}>
      {order.map((key) => {
        if (key === LINE) {
          return (
            <li
              key={LINE}
              className={`life-todo-line${dragging === LINE ? ' is-dragging' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, LINE)}
              onDragOver={(e) => onDragOver(e, LINE)}
              onDragEnd={onDragEnd}
              title="Drag the line: everything above it is for today"
            >
              <GripVertical size={14} className="life-todo-grip" aria-hidden />
              <span className="life-todo-line-rule" />
              <span className="life-todo-line-text">
                {lineAt === 0 ? 'Nothing for today yet' : `${lineAt} for today`}
                {pending && ' · saving'}
              </span>
              <span className="life-todo-line-rule" />
            </li>
          );
        }
        const n = byId.get(key);
        if (!n) return null;
        const openNow = (n.done_on === null || n.done_on > date) && (n.dropped_on === null || n.dropped_on > date);
        const handle = (
          <span className="life-todo-handle" draggable onDragStart={(e) => onDragStart(e, n.id)} onDragEnd={onDragEnd} title="Drag to reorder">
            <GripVertical size={14} className="life-todo-grip" aria-hidden />
          </span>
        );
        const later = order.indexOf(key) > lineAt;
        const up = later ? (
          <button type="button" className="life-todo-up" onClick={() => moveToToday(n.id)} aria-label="Move into today" title="Move into today">
            <ArrowUp size={15} strokeWidth={2.4} aria-hidden />
          </button>
        ) : null;
        return (
          <li key={n.id} className={dragging === n.id ? 'is-dragging' : undefined} onDragOver={(e) => onDragOver(e, n.id)}>
            <ul className="life-todo-group">
              {openNow ? (
                <Row t={n} date={date} done={false} today={!later} handle={handle} extra={up} />
              ) : (
                <li className="life-todo is-dim">{handle}<span className="life-todo-title">{n.title}</span></li>
              )}
              {n.children.map((c) => (
                <Row key={c.id} t={c} date={date} done={false} child />
              ))}
              <li className="life-todo-sub">
                <details>
                  <summary>Add a sub-item</summary>
                  <AddForm date={date} parent={n.id} placeholder="Sub-item" />
                </details>
              </li>
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export function TodoList({ date, open }: { date: string; open: TodoNode[] }) {
  return (
    <div className="life-todos">
      <AddForm date={date} placeholder="Something to do" />
      {open.length === 0 ? <p className="text-sm text-muted">Nothing open.</p> : <OpenList date={date} open={open} />}
    </div>
  );
}

// What got ticked off on this day, shown in the rail beside the to-do list.
export function DoneList({ date, done }: { date: string; done: TodoNode[] }) {
  const ids = done.flatMap((n) => [n.id, ...n.children.map((c) => c.id)]);
  const signature = ids.join('|');
  const [seen, setSeen] = useState(signature);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  if (seen !== signature) {
    // Whatever was not in the last list was just ticked off.
    const before = new Set(seen.split('|'));
    setSeen(signature);
    setFresh(new Set(ids.filter((id) => !before.has(id))));
  }
  return done.length === 0 ? (
    <p className="text-sm text-muted">Nothing yet.</p>
  ) : (
    <ul className="life-todo-list">
      {done.map((n) => (
        <li key={n.id}>
          <ul className="life-todo-group">
            {n.done_on === date ? <Row t={n} date={date} done fresh={fresh.has(n.id)} /> : <li className="life-todo is-dim"><span className="life-todo-title">{n.title}</span></li>}
            {n.children.map((c) => (
              <Row key={c.id} t={c} date={date} done child fresh={fresh.has(c.id)} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
