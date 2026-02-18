'use client';

import { useCallback, useRef } from 'react';
import { FX_NAMES, type FxName } from '@/lib/constants';
import type { LiteshowEngine } from '@/lib/engine';

interface DJPadProps {
  engineRef: React.RefObject<LiteshowEngine | null>;
  visible: boolean;
}

const PAD_LABELS: Record<FxName, string> = {
  strobe: 'Strobe',
  drop: 'Drop',
  bloom: 'Bloom',
  spin: 'Spin',
  color: 'Color',
  freeze: 'Freeze',
  burst: 'Burst',
  divine: 'Divine',
};

export default function DJPad({ engineRef, visible }: DJPadProps) {
  const activeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleTrigger = useCallback((name: FxName, el: HTMLButtonElement) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.triggerFx(name);
    if (name === 'color') {
      engine.paletteIdx = (engine.paletteIdx + 1) % 6;
    }
    el.classList.add('active');
    const prev = activeTimers.current.get(name);
    if (prev) clearTimeout(prev);
    activeTimers.current.set(name, setTimeout(() => el.classList.remove('active'), 200));
  }, [engineRef]);

  return (
    <div
      id="dj-pad"
      className={visible ? 'visible' : ''}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {FX_NAMES.map((name, i) => (
        <button
          key={name}
          className="pad"
          data-fx={name}
          onMouseDown={e => handleTrigger(name, e.currentTarget)}
          onTouchStart={e => { e.preventDefault(); handleTrigger(name, e.currentTarget); }}
        >
          <span className="pad-key">{i + 1}</span>
          {PAD_LABELS[name]}
        </button>
      ))}
    </div>
  );
}
