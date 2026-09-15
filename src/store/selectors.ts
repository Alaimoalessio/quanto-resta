'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore } from './scenario';
import { project } from '@/domain/engine';
import { diffKpis, sensitivity, type KpiDiff, type SensitivityItem } from '@/domain/compare';
import { buildVerdict, type Verdict } from '@/domain/verdict';
import type { Lever, Projection } from '@/domain/types';
import { monthLabel } from '@/lib/format';

export interface Projections {
  base: Projection;
  scenario: Projection;
  diff: KpiDiff;
  sensitivity: SensitivityItem[];
  verdict: Verdict;
  levers: Lever[];
  labels: string[]; // etichette dei mesi
}

/**
 * Proiezioni derivate dallo stato, memoizzate sulle sole ipotesi e leve:
 * ogni movimento di slider ricalcola base, scenario e sensibilità (N+2
 * proiezioni), che con il motore sotto i 2 ms restano entro un frame.
 */
export function useProjections(): Projections {
  const { assumptions, items } = useScenarioStore(
    useShallow((s) => ({ assumptions: s.assumptions, items: s.levers })),
  );
  const levers = useMemo(() => items.map((i) => i.lever), [items]);
  return useMemo(() => {
    const base = project(assumptions, []);
    const scenario = project(assumptions, levers);
    const sens = sensitivity(assumptions, levers, scenario);
    const verdict = buildVerdict({ assumptions, levers, base, scenario, sensitivity: sens });
    // L'anno compare solo dove serve: al primo mese e a gennaio, se la proiezione cambia anno.
    const crossesYear =
      scenario.months[0].year !== scenario.months[scenario.months.length - 1].year;
    const labels = scenario.months.map((m, i) =>
      monthLabel(m.month, m.year, crossesYear && (i === 0 || m.month === 1)),
    );
    return {
      base,
      scenario,
      diff: diffKpis(base.kpis, scenario.kpis),
      sensitivity: sens,
      verdict,
      levers,
      labels,
    };
  }, [assumptions, levers]);
}
