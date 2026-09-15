'use client';

import { useId, type KeyboardEvent } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string; // per aria
  size?: 'sm' | 'md';
}

/** Selettore a segmenti con semantica radio: frecce per muoversi, spazio/invio per scegliere. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: SegmentedProps<T>) {
  const id = useId();
  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const i = options.findIndex((o) => o.value === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(options[(i + 1) % options.length].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(options[(i - 1 + options.length) % options.length].value);
    }
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      className="inline-flex rounded border border-border bg-surface p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            id={`${id}-${o.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`rounded font-medium transition-colors ${size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm'} ${active ? 'bg-ink text-paper' : 'text-secondary hover:text-ink'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
