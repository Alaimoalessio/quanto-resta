'use client';

import type { ReactNode } from 'react';
import { Sparkline } from '@/charts/Sparkline';
import { useAnimatedValues } from '@/charts/primitives/useAnimatedPath';

export type KpiTone = 'neutral' | 'good' | 'bad' | 'warn';

export interface KpiTileProps {
  label: ReactNode;
  value: number | null; // null → si mostra `display`
  format: (v: number) => string;
  display?: string; // valore non numerico ("mai", "già oggi")
  sub?: string; // riga sotto il valore ("a febbraio")
  delta?: { value: number; format: (v: number) => string; goodWhenPositive?: boolean } | null;
  sparkline?: { values: number[]; zeroLine?: boolean };
  tone?: KpiTone;
}

const TONE: Record<KpiTone, string> = {
  neutral: 'text-ink',
  good: 'text-accent',
  bad: 'text-danger',
  warn: 'text-warning',
};

/** Tessera KPI: etichetta in maiuscoletto, valore grande con cifre che scorrono, delta con freccia, sparkline. */
export function KpiTile({
  label,
  value,
  format,
  display,
  sub,
  delta,
  sparkline,
  tone = 'neutral',
}: KpiTileProps) {
  const animated = useAnimatedValues(value === null ? [0] : [value], 350)[0];
  const text = value === null ? (display ?? '—') : format(animated);
  const deltaValue = delta?.value ?? 0;
  const good = delta
    ? (delta.goodWhenPositive ?? true)
      ? deltaValue >= 0
      : deltaValue <= 0
    : true;
  const showDelta = delta && Math.abs(deltaValue) >= 0.5;

  return (
    <div className="flex min-w-[9.5rem] flex-1 flex-col gap-1 rounded border border-border bg-surface px-3 py-2.5 lg:px-4 lg:py-3">
      <div className="min-h-8 text-[11px] leading-4 font-medium tracking-wider text-secondary uppercase lg:min-h-0">
        {label}
      </div>
      <div
        className={`font-display tnum text-2xl leading-none font-medium lg:text-[1.75rem] ${TONE[tone]}`}
      >
        {text}
      </div>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <div className="tnum text-xs">
          {showDelta ? (
            <span className={good ? 'text-accent' : 'text-danger'}>
              <span aria-hidden="true">{deltaValue > 0 ? '↑' : '↓'} </span>
              {delta.format(deltaValue)}
              <span className="sr-only"> rispetto alla base</span>
            </span>
          ) : (
            <span className="text-secondary">{sub ?? (delta ? 'come la base' : '')}</span>
          )}
        </div>
        {sparkline && (
          <Sparkline
            values={sparkline.values}
            zeroLine={sparkline.zeroLine}
            color={tone === 'bad' ? 'var(--danger)' : 'var(--accent)'}
            width={72}
            height={22}
          />
        )}
      </div>
    </div>
  );
}
