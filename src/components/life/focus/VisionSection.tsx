'use client';

import { useState } from 'react';
import type { VisionFields } from '@/lib/life/vision';
import { saveVision } from '@/app/life/(app)/goals/actions';
import { Markdown } from '@/components/life/Markdown';
import { SaveButton } from '@/components/life/SaveButton';

// The five-year vision, its own section under the ladder: the statement and
// the picture of life at the end of it on the left (first paragraph open, the
// rest behind "the whole picture"), the core values numbered on the right.
// Edit opens the three fields in place.
export function VisionSection({ vision, until }: { vision: VisionFields | null; until: number }) {
  const [editing, setEditing] = useState(false);
  const empty = !vision || (!vision.statement && !vision.values.length && !vision.picture);
  const paragraphs = (vision?.picture ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const [first, ...rest] = paragraphs;

  return (
    <section className="life-vision-block" id="vision" aria-label="The five-year vision">
      <div className="life-ladder-head">
        <span className="life-ladder-title">The five-year vision</span>
        <span className="life-ladder-q">The picture of my life at the end of {until}</span>
      </div>

      {editing || empty ? (
        <form action={saveVision} className="life-vision-form" onSubmit={() => setEditing(false)}>
          <label>
            <span>Vision statement</span>
            <input name="statement" defaultValue={vision?.statement ?? ''} maxLength={200} placeholder="Empower growth and belonging" autoComplete="off" />
          </label>
          <label>
            <span>Core values, one per line</span>
            <textarea name="values" defaultValue={vision?.values.join('\n') ?? ''} rows={6} placeholder={'Master your mindset\nExecute relentlessly'} />
          </label>
          <label>
            <span>The picture of my life at the end of it</span>
            <textarea name="picture" defaultValue={vision?.picture ?? ''} rows={16} placeholder="At the end of the five years, this is my life…" />
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
      ) : (
        <div className="life-vision-grid">
          <div className="life-vision-prose">
            {vision.statement && <p className="life-vision-statement">{vision.statement}</p>}
            {first && (
              <div className="life-md">
                <Markdown lines={first.split('\n')} />
              </div>
            )}
            {rest.length > 0 && (
              <details className="life-vision-more">
                <summary>The whole picture</summary>
                <div className="life-md">
                  <Markdown lines={rest.join('\n\n').split('\n')} />
                </div>
              </details>
            )}
            <button type="button" className="life-vision-edit" onClick={() => setEditing(true)}>
              Edit the vision
            </button>
          </div>
          {vision.values.length > 0 && (
            <div className="life-values-col">
              <p className="life-track-head">Core values</p>
              <ol className="life-values" aria-label="Core values">
                {vision.values.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
