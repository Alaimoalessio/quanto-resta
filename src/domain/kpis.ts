import type { Kpis, MonthResult } from './types';

/** Mesi consecutivi con utile operativo ≥ 0 richiesti per parlare di pareggio. */
const BREAK_EVEN_STREAK = 3;

export function findBreakEvenMonth(operatingProfits: number[]): number | null {
  for (let i = 0; i + BREAK_EVEN_STREAK <= operatingProfits.length; i++) {
    let ok = true;
    for (let k = 0; k < BREAK_EVEN_STREAK; k++) {
      if (operatingProfits[i + k] < 0) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return null;
}

export function findCriticalMonth(cash: number[]): number | null {
  const i = cash.findIndex((c) => c < 0);
  return i === -1 ? null : i;
}

/**
 * Runway: quanti mesi interi la cassa resta ≥ 0 se il flusso medio è negativo.
 * Se la cassa scende sotto zero nell'orizzonte, è il numero di mesi completati
 * prima; altrimenti si estrapola col flusso medio oltre l'orizzonte.
 */
export function computeRunway(cash: number[], netFlows: number[]): number | null {
  const n = netFlows.length;
  if (n === 0) return null;
  const avg = netFlows.reduce((s, v) => s + v, 0) / n;
  if (avg >= 0) return null;
  const critical = findCriticalMonth(cash);
  if (critical !== null) return critical;
  const cashEnd = cash[n - 1];
  return n + Math.floor(cashEnd / -avg);
}

export function computeKpis(months: MonthResult[], cashStart: number): Kpis {
  const cash = months.map((m) => m.cashEnd);
  const flows = months.map((m) => m.netCashFlow);
  const profits = months.map((m) => m.operatingProfit);
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = profits.reduce((s, v) => s + v, 0);

  let cashMin = cash.length ? cash[0] : cashStart;
  let cashMinMonth = 0;
  cash.forEach((c, i) => {
    if (c < cashMin) {
      cashMin = c;
      cashMinMonth = i;
    }
  });

  return {
    cashEnd: cash.length ? cash[cash.length - 1] : cashStart,
    cashMin,
    cashMinMonth,
    criticalMonth: findCriticalMonth(cash),
    breakEvenMonth: findBreakEvenMonth(profits),
    marginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    runwayMonths: computeRunway(cash, flows),
    totalRevenue,
    totalProfit,
  };
}
