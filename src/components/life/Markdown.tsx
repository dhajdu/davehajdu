import { Fragment } from 'react';
import { clean, statusOf, type Status } from '@/lib/life/focus-parse';
import { StatusMark } from './focus/StatusMark';

// Just enough markdown for journal blocks: ### headings, - and 1. lists,
// - [ ] checkboxes, **bold**, [links](url). No raw HTML.
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={k++}>{m[1]}</b>);
    else out.push(<a key={k++} href={m[3]} target="_blank" rel="noreferrer">{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const MARKS = /[✅❌🟡]/g;

export function Markdown({ lines }: { lines: string[] }) {
  const blocks: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={`l${blocks.length}`}>{list}</ul>);
    list = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) {
      flush();
      blocks.push(<h4 key={i}>{inline(h[1].replace(MARKS, '').trim())}</h4>);
      return;
    }
    const item = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) {
      const status: Status = statusOf(item[1]);
      const checked = /^\[x\]/i.test(item[1]);
      const marked = status !== 'open' || checked;
      list.push(
        <li key={i} className={marked ? 'has-mark' : undefined}>
          {marked && <StatusMark status={status === 'open' ? 'hit' : status} />}
          <span>{inline(clean(item[1]).replace(/^~~(.*)~~$/, '$1'))}</span>
        </li>
      );
      return;
    }
    flush();
    const status = statusOf(line);
    blocks.push(
      <p key={i}>
        {status !== 'open' && (
          <Fragment>
            <StatusMark status={status} />{' '}
          </Fragment>
        )}
        {inline(line.replace(MARKS, '').replace(/\*\*\s*\*\*/g, '').trim())}
      </p>
    );
  });
  flush();
  return <div className="life-md">{blocks}</div>;
}
