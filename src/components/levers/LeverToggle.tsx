'use client';

import type { LeverDefinition } from '@/config/levers';

interface LeverToggleProps {
  def: LeverDefinition;
  onAdd: () => void;
}

/** Chip "+ Alzo i prezzi": una leva inattiva, pronta da attivare. */
export function LeverToggle({ def, onAdd }: LeverToggleProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={def.description}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <span aria-hidden="true" className="text-secondary">
        +
      </span>
      {def.label}
    </button>
  );
}
