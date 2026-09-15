import type { Assumptions, Lever, MonthResult, Projection } from './types';
import { computeKpis } from './kpis';

/** Rata costante (ammortamento francese). Tasso annuo nominale, rate mensili. */
export function annuityPayment(principal: number, ratePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Quote di versamento delle imposte dell'anno: acconto a giugno, saldo a novembre. */
const TAX_SCHEDULE: ReadonlyArray<{ month: number; share: number }> = [
  { month: 6, share: 0.4 },
  { month: 11, share: 0.6 },
];

interface MonthState {
  priceFactor: number;
  volumeFactor: number;
  staff: number;
  rent: number;
  extraFixed: number;
  cogsPct: number;
  marketing: number;
  ownerDraw: number;
  loanPayment: number;
  investment: number;
  oneOffs: number;
}

function loanPaymentAt(t: number, start: number, months: number, pmt: number): number {
  return t >= start && t < start + months ? pmt : 0;
}

/**
 * Applica una leva allo stato del mese `t` (indice di proiezione a base 1).
 * Gli effetti sui ricavi sono fattori moltiplicativi, così il risultato non
 * dipende dall'ordine delle leve. I fattori di prezzo e di volume sono tenuti
 * separati perché il costo del venduto segue solo il volume: se alzo il
 * prezzo del caffè, il caffè in grani non costa di più.
 */
function applyLever(s: MonthState, lever: Lever, t: number): void {
  switch (lever.kind) {
    case 'price':
      if (t >= lever.from) {
        s.priceFactor *= 1 + lever.pct / 100;
        // Elasticità lineare: per ogni 1% di prezzo si perde `elasticity`% di
        // clienti. È un'approssimazione valida per variazioni piccole, ma è
        // l'unica che un titolare può stimare e correggere a occhio.
        s.volumeFactor *= Math.max(0, 1 - (lever.pct / 100) * lever.elasticity);
      }
      break;
    case 'volume':
      if (t >= lever.from) s.volumeFactor *= 1 + lever.pct / 100;
      break;
    case 'hire':
      if (t >= lever.from) {
        s.staff += lever.costMonthly;
        s.volumeFactor *= 1 + lever.revenueUpliftPct / 100;
      }
      break;
    case 'fire':
      if (t >= lever.from) {
        s.staff = Math.max(0, s.staff - lever.costMonthly);
        s.volumeFactor *= Math.max(0, 1 - lever.revenueDropPct / 100);
      }
      break;
    case 'openDays':
      if (t >= lever.from) {
        s.volumeFactor *= 1 + (lever.extraDaysPerWeek * lever.revenuePerDayPct) / 100;
        s.extraFixed += lever.extraCostMonthly;
      }
      break;
    case 'rent':
      if (t >= lever.from) s.rent = lever.newRentMonthly;
      break;
    case 'supplier':
      if (t >= lever.from) s.cogsPct += lever.cogsPctDelta;
      break;
    case 'investment':
      if (lever.financed) {
        const pmt = annuityPayment(lever.amount, lever.financed.ratePct, lever.financed.months);
        s.loanPayment += loanPaymentAt(t, lever.from, lever.financed.months, pmt);
      } else if (t === lever.from) {
        s.investment += lever.amount;
      }
      if (t >= lever.upliftFrom) s.volumeFactor *= 1 + lever.revenueUpliftPct / 100;
      break;
    case 'marketing':
      if (t >= lever.from && t <= lever.to) s.marketing += lever.monthly;
      // L'effetto arriva con ritardo e dura quanto la campagna, traslato.
      if (t >= lever.from + lever.lagMonths && t <= lever.to + lever.lagMonths) {
        s.volumeFactor *= 1 + lever.revenueUpliftPct / 100;
      }
      break;
    case 'ownerDraw':
      if (t >= lever.from) s.ownerDraw = lever.monthly;
      break;
    case 'oneOffCost':
      if (t === lever.month) s.oneOffs += lever.amount;
      break;
    case 'oneOffIncome':
      if (t === lever.month) s.oneOffs -= lever.amount;
      break;
  }
}

/**
 * Motore puro e deterministico: (ipotesi, leve) → proiezione mensile.
 *
 * Tasse: calcolate per anno solare sull'utile operativo positivo dell'anno,
 * versate 40% a giugno e 60% a novembre. Semplificazioni dichiarate:
 * - l'acconto di giugno è calcolato sull'utile effettivo dell'anno in corso
 *   (come se l'anno precedente fosse identico);
 * - le scadenze che cadono prima dell'inizio della proiezione si considerano
 *   già versate, quelle oltre l'orizzonte non entrano in cassa;
 * - un anno in perdita non paga imposte e non genera crediti.
 */
export function project(a: Assumptions, levers: Lever[]): Projection {
  const H = a.horizonMonths;
  const baseLoanPmt = a.loan ? annuityPayment(a.loan.principal, a.loan.ratePct, a.loan.months) : 0;
  const months: MonthResult[] = [];

  for (let i = 0; i < H; i++) {
    const t = i + 1;
    const offset = a.startMonth - 1 + i;
    const monthIdx = offset % 12;
    const s: MonthState = {
      priceFactor: 1,
      volumeFactor: 1,
      staff: a.staff.count * a.staff.costEachMonthly,
      rent: a.rentMonthly,
      extraFixed: 0,
      cogsPct: a.cogsPct,
      marketing: a.marketingMonthly,
      ownerDraw: a.ownerDrawMonthly,
      loanPayment: a.loan ? loanPaymentAt(t, a.loan.startMonth, a.loan.months, baseLoanPmt) : 0,
      investment: 0,
      oneOffs: 0,
    };
    for (const lever of levers) applyLever(s, lever, t);

    const revenueVolume = a.revenueMonthly * a.seasonality[monthIdx] * s.volumeFactor;
    const revenue = revenueVolume * s.priceFactor;
    const cogs = revenueVolume * (Math.max(0, s.cogsPct) / 100);
    const fixed = s.rent + a.utilitiesMonthly + a.otherFixedMonthly + s.extraFixed;
    const operatingProfit = revenue - cogs - s.staff - fixed - s.marketing;

    months.push({
      index: i,
      month: monthIdx + 1,
      year: a.startYear + Math.floor(offset / 12),
      revenue,
      cogs,
      staff: s.staff,
      fixed,
      marketing: s.marketing,
      loanPayment: s.loanPayment,
      ownerDraw: s.ownerDraw,
      investment: s.investment,
      oneOffs: s.oneOffs,
      operatingProfit,
      taxes: 0,
      netCashFlow: 0,
      cashEnd: 0,
    });
  }

  // Imposte per anno solare, assegnate ai mesi di versamento presenti nell'orizzonte.
  const profitByYear = new Map<number, number>();
  for (const m of months)
    profitByYear.set(m.year, (profitByYear.get(m.year) ?? 0) + m.operatingProfit);
  for (const m of months) {
    const due = TAX_SCHEDULE.find((q) => q.month === m.month);
    if (!due) continue;
    const taxable = Math.max(0, profitByYear.get(m.year) ?? 0);
    m.taxes = taxable * (a.taxPct / 100) * due.share;
  }

  let cash = a.cashStart;
  for (const m of months) {
    m.netCashFlow =
      m.operatingProfit - m.taxes - m.loanPayment - m.ownerDraw - m.investment - m.oneOffs;
    cash += m.netCashFlow;
    m.cashEnd = cash;
  }

  return { months, kpis: computeKpis(months, a.cashStart) };
}
