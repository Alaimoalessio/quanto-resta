'use client';

import { leverCatalog } from '@/config/levers';
import type { Lever } from '@/domain/types';
import { useScenarioStore, type LeverItem } from '@/store/scenario';
import { LeverSlider } from './LeverSlider';
import { MonthPills } from './MonthPills';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';

function getField(lever: Lever, key: string): number | undefined {
  const v = key
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      lever,
    );
  return typeof v === 'number' ? v : undefined;
}

function withField(lever: Lever, key: string, value: number): Partial<Lever> {
  const [head, tail] = key.split('.');
  if (!tail) return { [head]: value } as Partial<Lever>;
  const nested =
    (lever as unknown as Record<string, Record<string, number> | undefined>)[head] ?? {};
  return { [head]: { ...nested, [tail]: value } } as Partial<Lever>;
}

/** Una leva attiva con i suoi controlli, il mese di inizio e il pulsante per rimuoverla. */
export function LeverCard({ item }: { item: LeverItem }) {
  const { id, lever } = item;
  const def = leverCatalog[lever.kind];
  const updateLever = useScenarioStore((s) => s.updateLever);
  const removeLever = useScenarioStore((s) => s.removeLever);
  const horizon = useScenarioStore((s) => s.assumptions.horizonMonths);
  const financed = lever.kind === 'investment' && Boolean(lever.financed);

  const set = (key: string, value: number): void => updateLever(id, withField(lever, key, value));

  return (
    <section aria-label={def.label} className="rounded border border-border bg-surface p-4">
      <header className="mb-1 flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-tight font-medium">{def.label}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeLever(id)}
          aria-label={`Rimuovi ${def.label}`}
          className="-mr-2"
        >
          Rimuovi
        </Button>
      </header>
      <p className="mb-4 text-xs leading-relaxed text-secondary">{def.description}</p>

      {lever.kind === 'investment' && (
        <div className="mb-4">
          <Segmented
            label="Come lo paghi"
            size="sm"
            value={financed ? 'rate' : 'cash'}
            options={[
              { value: 'cash', label: 'Pago subito' },
              { value: 'rate', label: 'A rate' },
            ]}
            onChange={(v) =>
              updateLever(id, { financed: v === 'rate' ? { ratePct: 6, months: 24 } : undefined })
            }
          />
        </div>
      )}

      {(lever.kind === 'oneOffCost' || lever.kind === 'oneOffIncome') && (
        <label className="mb-3 flex flex-col gap-1 text-xs text-secondary">
          Che cos’è
          <input
            type="text"
            value={lever.label}
            maxLength={40}
            onChange={(e) => updateLever(id, { label: e.target.value })}
            className="rounded border border-border bg-paper px-2 py-1 text-sm text-ink outline-none focus-visible:border-accent"
          />
        </label>
      )}

      <div className="flex flex-col gap-4">
        {def.controls.map((c) => {
          if (c.key.startsWith('financed.') && !financed) return null;
          const value = getField(lever, c.key);
          if (value === undefined) return null;
          if (c.unit === 'mese') {
            const min =
              c.key === 'to'
                ? getField(lever, 'from')
                : c.key === 'upliftFrom'
                  ? getField(lever, 'from')
                  : 1;
            return (
              <MonthPills
                key={c.key}
                label={c.label}
                value={Math.min(value, horizon)}
                min={min}
                onChange={(t) => set(c.key, t)}
              />
            );
          }
          return (
            <LeverSlider key={c.key} control={c} value={value} onChange={(v) => set(c.key, v)} />
          );
        })}
      </div>
    </section>
  );
}
