'use client';

import { useState } from 'react';
import type { VisionFields } from '@/lib/life/vision';
import { saveVision } from '@/app/life/(app)/goals/actions';
import { Markdown } from '@/components/life/Markdown';
import { SaveButton } from '@/components/life/SaveButton';

// The five-year rung: the vision statement, the core values and the picture
// of life at the end of it, as prose. Edit opens the three fields in place.
export function LadderVision({ vision }: { vision: VisionFields | null }) {
  const [editing, setEditing] = useState(false);
  const empty = !vision || (!vision.statement && !vision.values.length && !vision.picture);

  if (editing || empty) {
    return (
      <form action={saveVision} className="life-vision-form" onSubmit={() => setEditing(false)}>
        <label>
          <span>Vision statement</span>
          <input name="statement" defaultValue={vision?.statement ?? ''} maxLength={200} placeholder="Empower growth and belonging" autoComplete="off" />
        </label>
        <label>
          <span>Core values, one per line</span>
          <textarea name="values" defaultValue={vision?.values.join('\n') ?? ''} rows={5} placeholder={'Master your mindset\nExecute relentlessly'} />
        </label>
        <label>
          <span>The picture of my life at the end of it</span>
          <textarea name="picture" defaultValue={vision?.picture ?? ''} rows={14} placeholder="At the end of the five years, this is my life…" />
        </label>
        <div className="life-vision-form-foot">
          <SaveButton>Save the vision</SaveButton>
          {!empty && (
            <button type="button" className="life-vision-cancel" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="life-vision-prose">
      {vision.statement && <p className="life-vision-statement">{vision.statement}</p>}
      {vision.values.length > 0 && (
        <ul className="life-values" aria-label="Core values">
          {vision.values.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      )}
      {vision.picture && (
        <div className="life-vision-picture">
          <p className="life-track-head">The picture of my life at the end of it</p>
          <div className="life-md">
            <Markdown lines={vision.picture.split('\n')} />
          </div>
        </div>
      )}
      <button type="button" className="life-vision-edit" onClick={() => setEditing(true)}>
        Edit the vision
      </button>
    </div>
  );
}
