import type { Assumptions } from './types';
import { BUSINESS_TYPES } from './types';

export interface ValidationIssue {
  field: string;
  message: string;
}

export const LIMITS = {
  cashStart: { min: -500_000, max: 5_000_000 },
  revenueMonthly: { min: 0, max: 2_000_000 },
  cogsPct: { min: 0, max: 95 },
  staffCount: { min: 0, max: 200 },
  staffCost: { min: 0, max: 20_000 },
  monthlyCost: { min: 0, max: 500_000 },
  taxPct: { min: 0, max: 60 },
  seasonality: { min: 0, max: 5 },
} as const;

const inRange = (v: number, r: { min: number; max: number }): boolean =>
  Number.isFinite(v) && v >= r.min && v <= r.max;

/** Somma dei coefficienti stagionali: deve fare 12 (a meno di arrotondamenti). */
export function seasonalitySum(seasonality: number[]): number {
  return seasonality.reduce((s, v) => s + v, 0);
}

/** Riscala i 12 coefficienti perché la somma torni a 12, mantenendo le proporzioni. */
export function normalizeSeasonality(seasonality: number[]): number[] {
  const sum = seasonalitySum(seasonality);
  if (sum <= 0) return Array.from({ length: 12 }, () => 1);
  // Arrotondo a 4 decimali e scarico il resto sull'ultimo mese, così la somma è esattamente 12.
  const scaled = seasonality.map((v) => Math.round((v * 12 * 10_000) / sum) / 10_000);
  const drift = Math.round((12 - seasonalitySum(scaled)) * 10_000) / 10_000;
  scaled[11] = Math.round((scaled[11] + drift) * 10_000) / 10_000;
  return scaled;
}

export function validateAssumptions(a: Assumptions): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (field: string, message: string): number => issues.push({ field, message });

  if (!BUSINESS_TYPES.includes(a.businessType)) push('businessType', 'Tipo di attività non valido');
  if (!Number.isInteger(a.startMonth) || a.startMonth < 1 || a.startMonth > 12)
    push('startMonth', 'Il mese di inizio deve essere tra gennaio e dicembre');
  if (a.horizonMonths !== 12 && a.horizonMonths !== 24)
    push('horizonMonths', "L'orizzonte può essere di 12 o 24 mesi");
  if (!inRange(a.cashStart, LIMITS.cashStart)) push('cashStart', 'Cassa iniziale fuori intervallo');
  if (!inRange(a.revenueMonthly, LIMITS.revenueMonthly))
    push('revenueMonthly', 'I ricavi mensili devono essere tra 0 e 2.000.000 €');
  if (!inRange(a.cogsPct, LIMITS.cogsPct))
    push('cogsPct', 'Il costo del venduto deve essere tra 0% e 95% dei ricavi');
  if (!inRange(a.staff.count, LIMITS.staffCount) || !Number.isInteger(a.staff.count))
    push('staff.count', 'Numero di persone non valido');
  if (!inRange(a.staff.costEachMonthly, LIMITS.staffCost))
    push('staff.costEachMonthly', 'Costo mensile per persona fuori intervallo');
  for (const f of [
    'rentMonthly',
    'utilitiesMonthly',
    'marketingMonthly',
    'otherFixedMonthly',
    'ownerDrawMonthly',
  ] as const) {
    if (!inRange(a[f], LIMITS.monthlyCost)) push(f, 'Importo mensile fuori intervallo');
  }
  if (!inRange(a.taxPct, LIMITS.taxPct)) push('taxPct', "L'aliquota deve essere tra 0% e 60%");
  if (a.seasonality.length !== 12) push('seasonality', 'Servono 12 coefficienti stagionali');
  else {
    if (a.seasonality.some((v) => !inRange(v, LIMITS.seasonality)))
      push('seasonality', 'Ogni mese deve valere tra 0 e 5 volte un mese medio');
    if (Math.abs(seasonalitySum(a.seasonality) - 12) > 0.01)
      push('seasonality', 'La stagionalità deve sommare a 12 (un anno di mesi medi)');
  }
  if (a.loan) {
    if (!(a.loan.principal >= 0) || !(a.loan.months >= 1) || !(a.loan.ratePct >= 0))
      push('loan', 'Finanziamento non valido');
  }
  return issues;
}
