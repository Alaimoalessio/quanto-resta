import { create } from 'zustand';
import type { Assumptions, BusinessType, Lever, Scenario } from '@/domain/types';
import { assumptionsFromTemplate } from '@/config/templates';

export interface LeverItem {
  id: string;
  lever: Lever;
}

export type View = 'base' | 'scenario' | 'confronto';

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string; // ISO
  scenario: Scenario;
  kpis: { cashEnd: number; cashMin: number; breakEvenMonth: number | null };
}

interface State {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  assumptions: Assumptions;
  levers: LeverItem[];
  view: View;
  selectedMonth: number | null;
  saved: SavedScenario[];
  compareWith: SavedScenario | null;
}

interface Actions {
  hydrate: (init: {
    scenario: Scenario | null;
    onboarded: boolean;
    saved: SavedScenario[];
    now: Date;
  }) => void;
  setBusinessType: (type: BusinessType) => void;
  updateAssumptions: (patch: Partial<Assumptions>) => void;
  setSeasonalityAt: (index: number, value: number) => void;
  addLever: (lever: Lever) => string;
  updateLever: (id: string, patch: Partial<Lever>) => void;
  removeLever: (id: string) => void;
  clearLevers: () => void;
  setView: (view: View) => void;
  setName: (name: string) => void;
  setSelectedMonth: (index: number | null) => void;
  setOnboarded: (v: boolean) => void;
  loadScenario: (scenario: Scenario) => void;
  setSaved: (saved: SavedScenario[]) => void;
  setCompareWith: (s: SavedScenario | null) => void;
}

export type ScenarioStore = State & Actions;

let counter = 0;
const newId = (): string => `l${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Calendario di default: si parte dal mese prossimo. */
export function defaultCalendar(
  now: Date,
): Pick<Assumptions, 'startMonth' | 'startYear' | 'horizonMonths'> {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startMonth: next.getMonth() + 1, startYear: next.getFullYear(), horizonMonths: 12 };
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  hydrated: false,
  onboarded: false,
  name: '',
  assumptions: assumptionsFromTemplate('bar', {
    startMonth: 1,
    startYear: 2026,
    horizonMonths: 12,
  }),
  levers: [],
  view: 'confronto',
  selectedMonth: null,
  saved: [],
  compareWith: null,

  hydrate: ({ scenario, onboarded, saved, now }) => {
    if (scenario) {
      set({
        hydrated: true,
        onboarded: true,
        name: scenario.name,
        assumptions: scenario.assumptions,
        levers: scenario.levers.map((lever) => ({ id: newId(), lever })),
        saved,
      });
      return;
    }
    set({
      hydrated: true,
      onboarded,
      assumptions: assumptionsFromTemplate('bar', defaultCalendar(now)),
      saved,
    });
  },

  setBusinessType: (type) => {
    const { startMonth, startYear, horizonMonths } = get().assumptions;
    set({
      assumptions: assumptionsFromTemplate(type, { startMonth, startYear, horizonMonths }),
      levers: [],
    });
  },

  updateAssumptions: (patch) => set((s) => ({ assumptions: { ...s.assumptions, ...patch } })),

  setSeasonalityAt: (index, value) =>
    set((s) => {
      const seasonality = [...s.assumptions.seasonality];
      seasonality[index] = value;
      return { assumptions: { ...s.assumptions, seasonality } };
    }),

  addLever: (lever) => {
    const id = newId();
    set((s) => ({ levers: [...s.levers, { id, lever }] }));
    return id;
  },

  updateLever: (id, patch) =>
    set((s) => ({
      levers: s.levers.map((item) =>
        item.id === id ? { id, lever: { ...item.lever, ...patch } as Lever } : item,
      ),
    })),

  removeLever: (id) => set((s) => ({ levers: s.levers.filter((l) => l.id !== id) })),
  clearLevers: () => set({ levers: [] }),
  setView: (view) => set({ view }),
  setName: (name) => set({ name }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setOnboarded: (onboarded) => set({ onboarded }),
  loadScenario: (scenario) =>
    set({
      name: scenario.name,
      assumptions: scenario.assumptions,
      levers: scenario.levers.map((lever) => ({ id: newId(), lever })),
      selectedMonth: null,
    }),
  setSaved: (saved) => set({ saved }),
  setCompareWith: (compareWith) => set({ compareWith }),
}));

/** Scenario "puro" (senza id delle leve), ordinato per mese di inizio come da specifica. */
export function toScenario(s: Pick<State, 'name' | 'assumptions' | 'levers'>): Scenario {
  const startOf = (l: Lever): number => ('from' in l ? l.from : l.month);
  const levers = s.levers.map((l) => l.lever).sort((a, b) => startOf(a) - startOf(b));
  return { name: s.name, assumptions: s.assumptions, levers };
}
