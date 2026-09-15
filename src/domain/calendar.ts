import type { Assumptions } from './types';

/** Mese di calendario (1–12) del mese di proiezione `t` (a base 1). */
export function calendarMonth(a: Pick<Assumptions, 'startMonth'>, t: number): number {
  return ((a.startMonth - 1 + (t - 1)) % 12) + 1;
}

/** Anno di calendario del mese di proiezione `t` (a base 1). */
export function calendarYear(a: Pick<Assumptions, 'startMonth' | 'startYear'>, t: number): number {
  return a.startYear + Math.floor((a.startMonth - 1 + (t - 1)) / 12);
}
