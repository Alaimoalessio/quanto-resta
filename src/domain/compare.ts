import type { Assumptions, Kpis, Lever, Projection } from './types';
import { project } from './engine';

export type KpiDiff = { [K in keyof Kpis]: number | null };

/** Differenza scenario − base per ogni KPI (null se un mese non esiste in uno dei due). */
export function diffKpis(base: Kpis, scenario: Kpis): KpiDiff {
  const keys = Object.keys(base) as (keyof Kpis)[];
  const out = {} as KpiDiff;
  for (const k of keys) {
    const b = base[k];
    const s = scenario[k];
    out[k] = b === null || s === null ? null : s - b;
  }
  return out;
}

export interface SensitivityItem {
  index: number; // posizione della leva nella lista
  lever: Lever;
  cashEndDelta: number; // quanto la leva sposta la cassa finale, da sola
  profitDelta: number; // quanto sposta l'utile operativo cumulato
}

/**
 * Sensibilità ("tornado"): per ogni leva attiva ricalcola lo scenario senza
 * di lei; la differenza è il peso della leva. Ordinata per impatto assoluto
 * decrescente sulla cassa finale.
 */
export function sensitivity(
  assumptions: Assumptions,
  levers: Lever[],
  full: Projection = project(assumptions, levers),
): SensitivityItem[] {
  const items = levers.map((lever, index) => {
    const without = project(
      assumptions,
      levers.filter((_, i) => i !== index),
    );
    return {
      index,
      lever,
      cashEndDelta: full.kpis.cashEnd - without.kpis.cashEnd,
      profitDelta: full.kpis.totalProfit - without.kpis.totalProfit,
    };
  });
  return items.sort((a, b) => Math.abs(b.cashEndDelta) - Math.abs(a.cashEndDelta));
}

export interface GoalSeekResult {
  value: number; // valore del parametro che raggiunge l'obiettivo
  metric: number; // valore della metrica ottenuto
  iterations: number;
}

/**
 * Bisezione su una funzione monotona: trova x in [lo, hi] tale che f(x) ≈ target.
 * Restituisce null se il target non è raggiungibile nell'intervallo.
 */
export function bisect(
  f: (x: number) => number,
  target: number,
  lo: number,
  hi: number,
  tolerance = 0.05,
  maxIterations = 60,
): GoalSeekResult | null {
  let fLo = f(lo) - target;
  let fHi = f(hi) - target;
  if (fLo === 0) return { value: lo, metric: target, iterations: 0 };
  if (fHi === 0) return { value: hi, metric: target, iterations: 0 };
  if (Math.sign(fLo) === Math.sign(fHi)) return null;
  let a = lo;
  let b = hi;
  let i = 0;
  while (b - a > tolerance && i < maxIterations) {
    const mid = (a + b) / 2;
    const fMid = f(mid) - target;
    if (Math.sign(fMid) === Math.sign(fLo)) {
      a = mid;
      fLo = fMid;
    } else {
      b = mid;
      fHi = fMid;
    }
    i++;
  }
  // Scelgo l'estremo dal lato "sicuro" (metrica ≥ target) quando esiste.
  const value = fHi >= 0 ? b : a;
  return { value, metric: f(value), iterations: i };
}

export type Metric = (p: Projection) => number;

export const metrics = {
  cashEnd: (p: Projection) => p.kpis.cashEnd,
  cashMin: (p: Projection) => p.kpis.cashMin,
  cashAt:
    (index: number) =>
    (p: Projection): number =>
      p.months[Math.min(index, p.months.length - 1)].cashEnd,
  totalProfit: (p: Projection) => p.kpis.totalProfit,
};

/**
 * Goal seek: "di quanto devo muovere questa leva perché la metrica valga
 * almeno `target`?". Varia il campo numerico `field` della leva `index`
 * nell'intervallo dato e restituisce il valore minimo che centra l'obiettivo.
 */
export function solveLever(
  assumptions: Assumptions,
  levers: Lever[],
  index: number,
  field: string,
  metric: Metric,
  target: number,
  range: [number, number],
  tolerance = 0.05,
): GoalSeekResult | null {
  const f = (x: number): number => {
    const patched = levers.map((l, i) => (i === index ? { ...l, [field]: x } : l)) as Lever[];
    return metric(project(assumptions, patched));
  };
  return bisect(f, target, range[0], range[1], tolerance);
}
