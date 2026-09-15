'use client';

import { useId } from 'react';
import type { LeverControl } from '@/config/levers';
import { NumberInput } from '@/components/ui/NumberInput';
import { Term } from '@/components/ui/Term';
import { useRafThrottle } from '@/lib/useRafThrottle';

interface LeverSliderProps {
  control: LeverControl;
  value: number;
  onChange: (v: number) => void;
}

const UNIT_LABEL: Record<string, string> = {
  '€': '€',
  '%': '%',
  punti: 'pt',
  x: '×',
  mesi: 'mesi',
  giorni: 'gg',
};

/** Etichetta, valore modificabile da tastiera, slider con riempimento. Aggiorna a ogni frame. */
export function LeverSlider({ control, value, onChange }: LeverSliderProps) {
  const id = useId();
  const throttled = useRafThrottle(onChange);
  const fill = ((value - control.min) / (control.max - control.min)) * 100;
  const decimals = control.step < 1 ? (control.step < 0.1 ? 2 : 1) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs text-secondary">
          {control.help ? <Term help={control.help}>{control.label}</Term> : control.label}
        </label>
        <NumberInput
          label={control.label}
          value={value}
          onChange={onChange}
          min={control.min}
          max={control.max}
          step={control.step}
          unit={UNIT_LABEL[control.unit]}
          decimals={decimals}
          className="w-28 text-sm"
        />
      </div>
      <input
        id={id}
        type="range"
        className="lever-range"
        style={{ '--fill': `${Math.max(0, Math.min(100, fill))}%` } as React.CSSProperties}
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        aria-label={control.label}
        aria-valuetext={`${value.toLocaleString('it-IT')} ${UNIT_LABEL[control.unit]}`}
        onChange={(e) => throttled(Number(e.target.value))}
      />
    </div>
  );
}
