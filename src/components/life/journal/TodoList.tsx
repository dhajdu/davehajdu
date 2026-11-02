import type { TodoNode, Todo } from '@/lib/life/journal';
import { formatDate } from '@/lib/life/metrics';
import { addTodo, dropTodo, setTodoDone } from '@/app/life/(app)/journal/[date]/actions';

// What is open on this day and what got done. Every control is a form, so it
// works without JavaScript and on a phone with a flaky connection.
function Row({ t, date, done, child = false }: { t: Todo; date: string; done: boolean; child?: boolean }) {
  return (
    <li className={`life-todo${child ? ' is-child' : ''}${done ? ' is-done' : ''}`}>
      <form action={setTodoDone} className="life-todo-check">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="done" value={done ? '0' : '1'} />
        <button type="submit" className={`life-mark${done ? ' is-hit' : ''}`} aria-label={done ? 'Mark not done' : 'Mark done'} title={done ? 'Not done' : 'Done'}>
          {done ? '✓' : ''}
        </button>
      </form>
      <span className="life-todo-title">
        {t.title}
        {!child && !done && t.added_on !== date && <small>since {formatDate(t.added_on, { month: 'short', day: 'numeric' })}</small>}
      </span>
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

export function TodoList({ date, open, done }: { date: string; open: TodoNode[]; done: TodoNode[] }) {
  return (
    <div className="life-todos">
      <AddForm date={date} placeholder="Something to do" />
      {open.length === 0 ? (
        <p className="text-sm text-muted">Nothing open.</p>
      ) : (
        <ul className="life-todo-list">
          {open.map((n) => (
            <li key={n.id}>
              <ul className="life-todo-group">
                {(n.done_on === null || n.done_on > date) && (n.dropped_on === null || n.dropped_on > date) ? (
                  <Row t={n} date={date} done={false} />
                ) : (
                  <li className="life-todo is-dim"><span className="life-todo-title">{n.title}</span></li>
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
          ))}
        </ul>
      )}

      <p className="life-stat-k life-todo-done-head">Done {date ? `on ${formatDate(date, { month: 'short', day: 'numeric' })}` : ''} · {done.reduce((n, d) => n + (d.done_on === date ? 1 : 0) + d.children.length, 0)}</p>
      {done.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul className="life-todo-list">
          {done.map((n) => (
            <li key={n.id}>
              <ul className="life-todo-group">
                {n.done_on === date ? <Row t={n} date={date} done /> : <li className="life-todo is-dim"><span className="life-todo-title">{n.title}</span></li>}
                {n.children.map((c) => (
                  <Row key={c.id} t={c} date={date} done child />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
