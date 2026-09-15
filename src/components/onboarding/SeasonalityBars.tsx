'use client';

import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { MONTHS_SHORT } from '@/lib/format';

interface SeasonalityBarsProps {
  values: number[]; // 12 coefficienti, 1 = mese medio
  onChange: (index: number, value: number) => void;
}

const MIN = 0.2;
const MAX = 2.5;
const H = 120;

/** Dodici barrette trascinabili: trascina per alzare o abbassare un mese, frecce da tastiera. */
export function SeasonalityBars({ values, onChange }: SeasonalityBarsProps) {
  const dragging = useRef<number | null>(null);

  const valueFromPointer = (e: PointerEvent<HTMLElement>, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (e.clientY - rect.top) / rect.height;
    return Math.round(Math.max(MIN, Math.min(MAX, ratio * MAX)) * 20) / 20;
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 0.25 : 0.05;
    if (e.key === 'ArrowUp') onChange(i, Math.min(MAX, values[i] + step));
    else if (e.key === 'ArrowDown') onChange(i, Math.max(MIN, values[i] - step));
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: H + 24 }}>
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            role="slider"
            tabIndex={0}
            aria-label={`${MONTHS_SHORT[i]}: ${Math.round(v * 100)}% di un mese medio`}
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={v}
            aria-valuetext={`${Math.round(v * 100)}%`}
            onKeyDown={(e) => onKey(i, e)}
            onPointerDown={(e) => {
              dragging.current = i;
              e.currentTarget.setPointerCapture(e.pointerId);
              onChange(i, valueFromPointer(e, e.currentTarget));
            }}
            onPointerMove={(e) => {
              if (dragging.current === i) onChange(i, valueFromPointer(e, e.currentTarget));
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            className="relative w-full cursor-ns-resize touch-none rounded-sm bg-border/40 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ height: H }}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-sm bg-accent"
              style={{ height: `${(v / MAX) * 100}%` }}
            />
            <div
              className="absolute inset-x-0 border-t border-dashed border-ink/40"
              style={{ bottom: `${(1 / MAX) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="tnum text-[10px] text-secondary">{MONTHS_SHORT[i]}</span>
        </div>
      ))}
    </div>
  );
}
