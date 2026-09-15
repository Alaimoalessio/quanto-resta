'use client';

import { useScenarioStore } from '@/store/scenario';
import { calendarMonth, calendarYear } from '@/domain/calendar';
import { MONTHS_SHORT } from '@/lib/format';

interface MonthPillsProps {
  value: number; // indice di proiezione a base 1
  onChange: (t: number) => void;
  label: string;
  min?: number;
}

/** Selettore del mese a pillole: i mesi dell'orizzonte, con l'anno quando sono 24. */
export function MonthPills({ value, onChange, label, min = 1 }: MonthPillsProps) {
  const a = useScenarioStore((s) => s.assumptions);
  const months = Array.from({ length: a.horizonMonths }, (_, i) => i + 1);
  const showYear = a.horizonMonths > 12;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-secondary">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {months.map((t) => {
          const active = t === value;
          const disabled = t < min;
          const m = calendarMonth(a, t);
          const firstOfYear = showYear && (t === 1 || m === 1);
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${MONTHS_SHORT[m - 1]} ${calendarYear(a, t)}`}
              disabled={disabled}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') onChange(Math.min(a.horizonMonths, value + 1));
                if (e.key === 'ArrowLeft') onChange(Math.max(min, value - 1));
              }}
              className={`tnum h-6 min-w-8 rounded-full px-1.5 text-[11px] leading-none capitalize transition-colors disabled:opacity-30 ${active ? 'bg-accent text-paper' : 'bg-paper text-secondary hover:bg-border/60 hover:text-ink'} ${firstOfYear ? 'ml-1' : ''}`}
            >
              {MONTHS_SHORT[m - 1]}
              {firstOfYear && (
                <span className="ml-0.5 opacity-70">{String(calendarYear(a, t)).slice(2)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
