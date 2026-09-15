'use client';

import { useEffect } from 'react';
import { useScenarioStore } from '@/store/scenario';
import { decodeScenario } from '@/domain/share';
import { persistence } from '@/lib/persistence';
import { SHARE_PARAM, useUrlSync } from '@/lib/useUrlSync';
import { ScenarioBar } from './dashboard/ScenarioBar';
import { ScenarioActions } from './dashboard/ScenarioActions';
import { Dashboard } from './dashboard/Dashboard';
import { LeverGroup } from './levers/LeverGroup';
import { Onboarding } from './onboarding/Onboarding';
import { Sheet } from './ui/Sheet';

function Skeleton() {
  return (
    <div
      className="mx-auto max-w-[1600px] animate-pulse px-4 py-6 md:px-6"
      aria-busy="true"
      aria-label="Caricamento"
    >
      <div className="mb-6 h-8 w-40 rounded bg-border/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded bg-border/40" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded bg-border/30" />
    </div>
  );
}

export function Simulator() {
  const hydrated = useScenarioStore((s) => s.hydrated);
  const onboarded = useScenarioStore((s) => s.onboarded);
  const hydrate = useScenarioStore((s) => s.hydrate);
  const setOnboarded = useScenarioStore((s) => s.setOnboarded);
  useUrlSync();

  // Prima l'URL condiviso, poi l'ultimo scenario in localStorage, altrimenti l'onboarding.
  useEffect(() => {
    if (hydrated) return;
    const fromUrl = new URLSearchParams(window.location.search).get(SHARE_PARAM);
    const stored = persistence.readCurrent();
    const scenario =
      (fromUrl && decodeScenario(fromUrl)) || (stored && decodeScenario(stored)) || null;
    const wasOnboarded = persistence.readOnboarded();
    hydrate({
      scenario: wasOnboarded || fromUrl ? scenario : null,
      onboarded: wasOnboarded,
      saved: persistence.readSaved(),
      now: new Date(),
    });
  }, [hydrated, hydrate]);

  if (!hydrated) return <Skeleton />;

  if (!onboarded) {
    const firstVisit = !persistence.readOnboarded();
    const done = (): void => {
      persistence.writeOnboarded(true);
      setOnboarded(true);
    };
    return <Onboarding firstVisit={firstVisit} onDone={done} onCancel={() => setOnboarded(true)} />;
  }

  return (
    <div className="min-h-screen">
      <ScenarioBar onChangeBusiness={() => setOnboarded(false)} actions={<ScenarioActions />} />
      <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-24 md:px-6 lg:grid lg:grid-cols-[36fr_64fr] lg:gap-6 lg:pb-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 pb-8">
            <LeverGroup />
          </div>
        </aside>
        <main>
          <Dashboard />
        </main>
      </div>
      <div className="lg:hidden">
        <Sheet title="Le leve">
          <LeverGroup />
        </Sheet>
      </div>
    </div>
  );
}
