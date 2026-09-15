'use client';

import Link from 'next/link';
import { useScenarioStore, type View } from '@/store/scenario';
import { templates } from '@/config/templates';
import { brand } from '@/config/brand';
import { Logo } from '@/components/ui/Logo';
import { Segmented } from '@/components/ui/Segmented';

const VIEWS: { value: View; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'confronto', label: 'Confronto' },
];

interface ScenarioBarProps {
  onChangeBusiness: () => void;
  actions?: React.ReactNode;
}

/** Barra sottile in alto: attività, vista, azioni. */
export function ScenarioBar({ onChangeBusiness, actions }: ScenarioBarProps) {
  const businessType = useScenarioStore((s) => s.assumptions.businessType);
  const view = useScenarioStore((s) => s.view);
  const setView = useScenarioStore((s) => s.setView);

  return (
    <header className="relative sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-ink" aria-label={brand.name}>
          <Logo />
          <span className="font-display hidden text-lg font-semibold sm:inline">{brand.name}</span>
        </Link>
        <span className="hidden text-border sm:inline" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          onClick={onChangeBusiness}
          className="truncate text-sm text-secondary hover:text-ink"
        >
          {templates[businessType].label}
          <span className="sr-only">, cambia attività</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Segmented size="sm" label="Vista" value={view} options={VIEWS} onChange={setView} />
          {actions}
        </div>
      </div>
    </header>
  );
}
