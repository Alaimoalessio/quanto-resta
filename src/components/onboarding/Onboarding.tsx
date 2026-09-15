'use client';

import { useState } from 'react';
import { useScenarioStore } from '@/store/scenario';
import { templates } from '@/config/templates';
import { normalizeSeasonality, validateAssumptions } from '@/domain/validate';
import type { BusinessType } from '@/domain/types';
import { brand } from '@/config/brand';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { BusinessGrid } from './BusinessGrid';
import { NumbersReview } from './NumbersReview';

interface OnboardingProps {
  firstVisit: boolean;
  onDone: () => void;
  onCancel: () => void;
}

/** Prima visita: scelta dell'attività, poi revisione dei numeri di partenza. */
export function Onboarding({ firstVisit, onDone, onCancel }: OnboardingProps) {
  const assumptions = useScenarioStore((s) => s.assumptions);
  const setBusinessType = useScenarioStore((s) => s.setBusinessType);
  const update = useScenarioStore((s) => s.updateAssumptions);
  const [step, setStep] = useState<0 | 1>(firstVisit ? 0 : 1);
  const [chosen, setChosen] = useState<BusinessType | null>(
    firstVisit ? null : assumptions.businessType,
  );
  const invalid = validateAssumptions(assumptions).some((i) => i.field !== 'seasonality');

  const finish = (): void => {
    update({ seasonality: normalizeSeasonality(assumptions.seasonality) });
    onDone();
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <span className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg font-semibold">{brand.name}</span>
        </span>
        {!firstVisit && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Torna al simulatore
          </Button>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        {step === 0 ? (
          <>
            <h1 className="font-display mt-8 mb-2 text-4xl font-medium md:text-5xl">
              Che attività hai?
            </h1>
            <p className="mb-8 max-w-xl text-secondary">
              Parti da numeri tipici della tua attività, poi correggili con i tuoi. In un minuto
              vedi cosa succede alla cassa se alzi i prezzi, assumi o apri un giorno in più.
            </p>
            <BusinessGrid
              value={chosen}
              onSelect={(t) => {
                setChosen(t);
                if (t !== assumptions.businessType || firstVisit) setBusinessType(t);
              }}
            />
            <div className="mt-8 flex justify-end">
              <Button variant="primary" disabled={!chosen} onClick={() => setStep(1)}>
                Avanti
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display mt-8 mb-2 text-4xl font-medium md:text-5xl">
              Questi sono i numeri tipici di un{' '}
              {templates[assumptions.businessType].label.toLowerCase()}
            </h1>
            <p className="mb-8 max-w-xl text-secondary">
              Correggili con i tuoi: bastano gli ordini di grandezza. Potrai cambiarli in ogni
              momento.
            </p>
            <NumbersReview />
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Cambia attività
              </Button>
              <Button variant="primary" disabled={invalid} onClick={finish}>
                Vai al simulatore
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
