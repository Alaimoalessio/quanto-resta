import type { BusinessType, Lever, LeverKind } from '@/domain/types';
import { templates } from './templates';

/** Elasticità di prezzo tipica per attività: quanto è facile cambiare fornitore per il cliente. */
const ELASTICITY: Record<BusinessType, number> = {
  bar: 0.4,
  ristorante: 0.5,
  negozio: 0.6,
  artigiano: 0.2,
  studio: 0.3,
  ecommerce: 0.8,
};

const round50 = (v: number): number => Math.round(v / 50) * 50;

/** Valori di default sensati per la leva, derivati dai numeri del template dell'attività. */
export function defaultLever(kind: LeverKind, type: BusinessType, from = 1): Lever {
  const t = templates[type].assumptions;
  const rev = t.revenueMonthly;
  switch (kind) {
    case 'price':
      return { kind, pct: 5, elasticity: ELASTICITY[type], from };
    case 'volume':
      return { kind, pct: 10, from };
    case 'hire':
      return { kind, costMonthly: t.staff.costEachMonthly, revenueUpliftPct: 10, from };
    case 'fire':
      return { kind, costMonthly: t.staff.costEachMonthly, revenueDropPct: 5, from };
    case 'openDays':
      return {
        kind,
        extraDaysPerWeek: 1,
        revenuePerDayPct: 12,
        extraCostMonthly: round50(t.staff.costEachMonthly * 0.3),
        from,
      };
    case 'rent':
      return { kind, newRentMonthly: round50(t.rentMonthly * 0.85), from };
    case 'supplier':
      return { kind, cogsPctDelta: -3, from };
    case 'investment':
      return {
        kind,
        amount: round50(rev * 0.5),
        from,
        revenueUpliftPct: 5,
        upliftFrom: from + 1,
        financed: { ratePct: 6, months: 24 },
      };
    case 'marketing':
      return {
        kind,
        monthly: round50(Math.max(300, rev * 0.02)),
        from,
        to: from + 2,
        revenueUpliftPct: 8,
        lagMonths: 1,
      };
    case 'ownerDraw':
      return { kind, monthly: round50(t.ownerDrawMonthly * 0.8), from };
    case 'oneOffCost':
      return { kind, amount: round50(rev * 0.2), month: from, label: 'Spesa straordinaria' };
    case 'oneOffIncome':
      return { kind, amount: round50(rev * 0.3), month: from, label: 'Incasso straordinario' };
  }
}
