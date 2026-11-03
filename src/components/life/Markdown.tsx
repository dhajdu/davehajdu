import { Fragment } from 'react';
import { clean, statusOf, type Status } from '@/lib/life/focus-parse';
import { StatusMark } from './focus/StatusMark';

// Just enough markdown for journal blocks: ### headings, - and 1. lists,
// - [ ] checkboxes, ***bold italic***, **bold**, *italic*, [links](url). No raw HTML.
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*([^*\s](?:[^*]*?[^*\s])?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={k++}><i>{m[1]}</i></b>);
    else if (m[2] !== undefined) out.push(<b key={k++}>{m[2]}</b>);
    else if (m[3] !== undefined) out.push(<i key={k++}>{m[3]}</i>);
    else out.push(<a key={k++} href={m[5]} target="_blank" rel="noreferrer">{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const MARKS = /[✅❌🟡]/gu;

export function Markdown({ lines }: { lines: string[] }) {
  const blocks: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  let ordered = false;
  const flush = () => {
    if (list.length) blocks.push(ordered ? <ol key={`l${blocks.length}`}>{list}</ol> : <ul key={`l${blocks.length}`}>{list}</ul>);
    list = [];
  };
  let table: string[][] | null = null;
  const flushTable = () => {
    if (!table) return;
    const rows = table;
    table = null;
    blocks.push(
      <table key={`t${blocks.length}`} className="life-md-table">
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri}>
              {cells.map((c, ci) => (
                <td key={ci}>{inline(c.replace(MARKS, (m) => m))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith('|')) {
      flush();
      if (/^\|\s*-{2,}/.test(line)) return; // header separator
      const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      table = [...(table ?? []), cells];
      return;
    }
    flushTable();
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) {
      flush();
      blocks.push(<h4 key={i}>{inline(h[1].replace(MARKS, '').trim())}</h4>);
      return;
    }
    const item = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) {
      const isOrdered = /^\d+\./.test(line);
      if (list.length && isOrdered !== ordered) flush();
      ordered = isOrdered;
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
  flushTable();
  return <div className="life-md">{blocks}</div>;
}
