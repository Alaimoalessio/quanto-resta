import { describe, expect, it } from 'vitest';
import { decodeScenario, encodeScenario } from './share';
import type { Scenario } from './types';
import { assumptionsFromTemplate } from '@/config/templates';

const scenario: Scenario = {
  name: 'Estate con l’aiuto — prova "n°2"',
  assumptions: {
    ...assumptionsFromTemplate('ristorante', { startMonth: 3, startYear: 2026, horizonMonths: 24 }),
    loan: { principal: 20_000, ratePct: 4.5, months: 48, startMonth: 1 },
  },
  levers: [
    { kind: 'price', pct: 5.5, elasticity: 0.4, from: 2 },
    { kind: 'volume', pct: -10, from: 3 },
    { kind: 'hire', costMonthly: 2_300, revenueUpliftPct: 8, from: 5 },
    { kind: 'fire', costMonthly: 2_300, revenueDropPct: 3, from: 9 },
    { kind: 'openDays', extraDaysPerWeek: 1, revenuePerDayPct: 12, extraCostMonthly: 600, from: 3 },
    { kind: 'rent', newRentMonthly: 2_500, from: 7 },
    { kind: 'supplier', cogsPctDelta: -3, from: 2 },
    {
      kind: 'investment',
      amount: 18_000,
      from: 2,
      revenueUpliftPct: 5,
      upliftFrom: 3,
      financed: { ratePct: 5, months: 36 },
    },
    { kind: 'investment', amount: 3_000, from: 4, revenueUpliftPct: 2, upliftFrom: 4 },
    { kind: 'marketing', monthly: 800, from: 4, to: 6, revenueUpliftPct: 6, lagMonths: 1 },
    { kind: 'ownerDraw', monthly: 2_000, from: 6 },
    { kind: 'oneOffCost', amount: 6_000, month: 9, label: 'Stock di Natale_!~*' },
    { kind: 'oneOffIncome', amount: 1_500, month: 10, label: 'Rimborso' },
  ],
};

describe('codifica dello scenario', () => {
  it('codifica e decodifica senza perdite', () => {
    const s = encodeScenario(scenario);
    expect(decodeScenario(s)).toEqual(scenario);
  });

  it('usa solo caratteri sicuri per l’URL', () => {
    const s = encodeScenario(scenario);
    expect(encodeURIComponent(s)).toBe(s);
    expect(new URLSearchParams({ s }).get('s')).toBe(s);
    expect(s.length).toBeLessThan(600);
  });

  it('senza leve e senza finanziamento', () => {
    const sc: Scenario = {
      name: '',
      assumptions: assumptionsFromTemplate('bar', {
        startMonth: 1,
        startYear: 2026,
        horizonMonths: 12,
      }),
      levers: [],
    };
    expect(decodeScenario(encodeScenario(sc))).toEqual(sc);
  });

  it('rifiuta stringhe non valide', () => {
    expect(decodeScenario('')).toBeNull();
    expect(decodeScenario('2~a')).toBeNull();
    expect(decodeScenario(encodeScenario(scenario).replace(/^1~/, '1~99'))).toBeNull();
    expect(decodeScenario(encodeScenario(scenario) + '!7_x')).toBeNull();
  });
});
