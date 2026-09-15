'use client';

import { useShallow } from 'zustand/react/shallow';
import { leverList } from '@/config/levers';
import { defaultLever } from '@/config/leverDefaults';
import { templates } from '@/config/templates';
import { suggestedLevers } from '@/config/suggested';
import { useScenarioStore } from '@/store/scenario';
import { LeverCard } from './LeverCard';
import { LeverToggle } from './LeverToggle';
import { Button } from '@/components/ui/Button';

/** Pannello delle leve: domande suggerite, leve attive, catalogo delle leve inattive. */
export function LeverGroup() {
  const { levers, businessType, horizon } = useScenarioStore(
    useShallow((s) => ({
      levers: s.levers,
      businessType: s.assumptions.businessType,
      horizon: s.assumptions.horizonMonths,
    })),
  );
  const addLever = useScenarioStore((s) => s.addLever);
  const clearLevers = useScenarioStore((s) => s.clearLevers);
  const activeKinds = new Set(levers.map((l) => l.lever.kind));
  const suggested = suggestedLevers[businessType].filter((s) => !activeKinds.has(s.lever.kind));
  const defaultFrom = Math.min(2, horizon);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-medium">Le leve</h2>
        {levers.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearLevers}>
            Togli tutte
          </Button>
        )}
      </div>

      {suggested.length > 0 && (
        <section aria-label="Domande frequenti" className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-secondary uppercase">
            Le domande che si fa chi ha un {templates[businessType].label.toLowerCase()}
          </h3>
          {suggested.map((s) => (
            <button
              key={s.question}
              type="button"
              onClick={() => addLever({ ...s.lever })}
              className="rounded border border-border bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:text-accent"
            >
              {s.question}
            </button>
          ))}
        </section>
      )}

      {levers.length > 0 && (
        <section aria-label="Leve attive" className="flex flex-col gap-3">
          {levers.map((item) => (
            <LeverCard key={item.id} item={item} />
          ))}
        </section>
      )}

      <section aria-label="Aggiungi una leva" className="flex flex-col gap-2">
        <h3 className="text-xs font-medium tracking-wide text-secondary uppercase">
          {levers.length ? 'Aggiungi un’altra leva' : 'Aggiungi una leva'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {leverList.map((def) => (
            <LeverToggle
              key={def.kind}
              def={def}
              onAdd={() => addLever(defaultLever(def.kind, businessType, defaultFrom))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
