'use client';

import { useState, type KeyboardEvent } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  decimals?: number;
  label: string; // aria-label
  className?: string;
  align?: 'left' | 'right';
}

const fmt = (v: number, decimals: number): string =>
  v.toLocaleString('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  });

const parse = (s: string): number | null => {
  const cleaned = s
    .replace(/\s|€|%/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace('−', '-');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

/**
 * Campo numerico "all'italiana": mostra 1.250,5, accetta virgola e punto, frecce
 * su/giù per muoversi di uno step (con Shift ×10), clamp al blur.
 */
export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit,
  decimals = 2,
  label,
  className = '',
  align = 'right',
}: NumberInputProps) {
  const [text, setText] = useState(fmt(value, decimals));
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // Fuori dal focus il campo mostra sempre il valore corrente; il testo locale serve solo mentre si scrive.
  const shown = focused ? text : fmt(value, decimals);

  const commit = (raw: string): void => {
    const n = parse(raw);
    if (n === null) {
      setInvalid(true);
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    setInvalid(false);
    onChange(clamped);
    setText(fmt(clamped, decimals));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const dir = e.key === 'ArrowUp' ? 1 : -1;
    const delta = step * (e.shiftKey ? 10 : 1) * dir;
    const next = Math.min(max, Math.max(min, Math.round((value + delta) / step) * step));
    onChange(next);
    setText(fmt(next, decimals));
  };

  return (
    <span className={`tnum inline-flex items-baseline gap-1 ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={shown}
        onChange={(e) => {
          setText(e.target.value);
          if (parse(e.target.value) !== null) setInvalid(false);
        }}
        onFocus={(e) => {
          setText(fmt(value, decimals));
          setFocused(true);
          e.target.select();
        }}
        onBlur={(e) => {
          setFocused(false);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          onKey(e);
          if (e.key === 'Enter') commit(e.currentTarget.value);
        }}
        className={`w-full min-w-0 rounded border bg-transparent px-1.5 py-0.5 font-medium outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 ${align === 'right' ? 'text-right' : 'text-left'} ${invalid ? 'border-danger' : 'border-transparent hover:border-border'}`}
      />
      {unit && <span className="shrink-0 text-xs text-secondary">{unit}</span>}
    </span>
  );
}
