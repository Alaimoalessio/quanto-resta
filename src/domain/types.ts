/**
 * Modello dati del simulatore. Questo modulo (e tutto `domain/`) non importa
 * nulla da React, Next o d3: ogni numero nasce qui ed è testato qui.
 */

export type BusinessType = 'bar' | 'ristorante' | 'negozio' | 'artigiano' | 'studio' | 'ecommerce';

export const BUSINESS_TYPES: readonly BusinessType[] = [
  'bar',
  'ristorante',
  'negozio',
  'artigiano',
  'studio',
  'ecommerce',
] as const;

export type Horizon = 12 | 24;

export interface Loan {
  principal: number;
  ratePct: number; // tasso annuo nominale, es. 6 = 6%
  months: number;
  startMonth: number; // indice di proiezione, 1 = primo mese
}

export interface Assumptions {
  businessType: BusinessType;
  startMonth: number; // 1–12, mese di calendario in cui parte la proiezione
  startYear: number; // serve per le tasse per anno solare e per le etichette
  horizonMonths: Horizon;
  cashStart: number;
  revenueMonthly: number; // ricavi medi mensili
  seasonality: number[]; // 12 coefficienti indicizzati per mese di calendario (0 = gennaio), somma 12
  cogsPct: number; // 0–100, costo del venduto in % dei ricavi
  staff: { count: number; costEachMonthly: number };
  rentMonthly: number;
  utilitiesMonthly: number;
  marketingMonthly: number;
  otherFixedMonthly: number;
  ownerDrawMonthly: number;
  taxPct: number; // 0–100, aliquota effettiva semplificata sull'utile operativo
  loan?: Loan;
}

/**
 * Tutti i mesi delle leve (`from`, `to`, `month`, `upliftFrom`) sono indici di
 * proiezione a base 1 (1 = primo mese simulato), non mesi di calendario: con
 * orizzonte a 24 mesi "marzo" sarebbe ambiguo. L'interfaccia li mostra come
 * pillole con il nome del mese.
 */
export type Lever =
  | { kind: 'price'; pct: number; elasticity: number; from: number }
  | { kind: 'volume'; pct: number; from: number }
  | { kind: 'hire'; costMonthly: number; revenueUpliftPct: number; from: number }
  | { kind: 'fire'; costMonthly: number; revenueDropPct: number; from: number }
  | {
      kind: 'openDays';
      extraDaysPerWeek: number;
      revenuePerDayPct: number;
      extraCostMonthly: number;
      from: number;
    }
  | { kind: 'rent'; newRentMonthly: number; from: number }
  | { kind: 'supplier'; cogsPctDelta: number; from: number }
  | {
      kind: 'investment';
      amount: number;
      from: number;
      revenueUpliftPct: number;
      upliftFrom: number;
      financed?: { ratePct: number; months: number };
    }
  | {
      kind: 'marketing';
      monthly: number;
      from: number;
      to: number;
      revenueUpliftPct: number;
      lagMonths: number;
    }
  | { kind: 'ownerDraw'; monthly: number; from: number }
  | { kind: 'oneOffCost'; amount: number; month: number; label: string }
  | { kind: 'oneOffIncome'; amount: number; month: number; label: string };

export type LeverKind = Lever['kind'];

export const LEVER_KINDS: readonly LeverKind[] = [
  'price',
  'volume',
  'hire',
  'fire',
  'openDays',
  'rent',
  'supplier',
  'investment',
  'marketing',
  'ownerDraw',
  'oneOffCost',
  'oneOffIncome',
] as const;

export interface Scenario {
  name: string;
  assumptions: Assumptions;
  levers: Lever[];
}

export interface MonthResult {
  index: number; // 0-based nella proiezione
  month: number; // 1–12 di calendario
  year: number;
  revenue: number;
  cogs: number;
  staff: number;
  fixed: number; // affitto + utenze + altri fissi + costi extra di apertura
  marketing: number;
  loanPayment: number;
  ownerDraw: number;
  investment: number; // investimenti pagati cash nel mese
  oneOffs: number; // costi una tantum − incassi una tantum
  operatingProfit: number; // ricavi − cogs − personale − fissi − marketing
  taxes: number;
  netCashFlow: number;
  cashEnd: number;
}

export interface Kpis {
  cashEnd: number;
  cashMin: number;
  cashMinMonth: number; // indice 0-based del mese con la cassa più bassa
  criticalMonth: number | null; // primo mese (0-based) con cassa < 0
  breakEvenMonth: number | null; // primo mese (0-based) da cui l'utile operativo resta ≥ 0 per 3 mesi
  marginPct: number; // utile operativo / ricavi sull'orizzonte, in %
  runwayMonths: number | null; // mesi prima che la cassa finisca, se il flusso medio è negativo
  totalRevenue: number;
  totalProfit: number;
}

export interface Projection {
  months: MonthResult[];
  kpis: Kpis;
}
