'use client';

import { templateList } from '@/config/templates';
import type { BusinessType } from '@/domain/types';
import { BusinessIcon } from './BusinessIcons';

interface BusinessGridProps {
  value: BusinessType | null;
  onSelect: (type: BusinessType) => void;
}

/** Passo 1: griglia delle sei attività. */
export function BusinessGrid({ value, onSelect }: BusinessGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo di attività"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {templateList.map((t) => {
        const active = value === t.type;
        return (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(t.type)}
            className={`flex items-start gap-4 rounded border bg-surface p-4 text-left transition-colors hover:border-accent ${active ? 'border-accent ring-2 ring-accent/25' : 'border-border'}`}
          >
            <span className={`shrink-0 ${active ? 'text-accent' : 'text-secondary'}`}>
              <BusinessIcon type={t.type} />
            </span>
            <span>
              <span className="font-display block text-xl font-medium">{t.label}</span>
              <span className="mt-0.5 block text-sm leading-snug text-secondary">
                {t.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
