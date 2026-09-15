import type { Assumptions } from './types';

/** Ipotesi "piatte" per test con numeri calcolabili a mano. */
export function flat(over: Partial<Assumptions> = {}): Assumptions {
  return {
    businessType: 'bar',
    startMonth: 1,
    startYear: 2026,
    horizonMonths: 12,
    cashStart: 0,
    revenueMonthly: 10_000,
    seasonality: Array.from({ length: 12 }, () => 1),
    cogsPct: 0,
    staff: { count: 0, costEachMonthly: 0 },
    rentMonthly: 0,
    utilitiesMonthly: 0,
    marketingMonthly: 0,
    otherFixedMonthly: 0,
    ownerDrawMonthly: 0,
    taxPct: 0,
    ...over,
  };
}
