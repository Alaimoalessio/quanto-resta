import { describe, expect, it } from 'vitest';
import { computeRunway, findBreakEvenMonth, findCriticalMonth } from './kpis';
import { project } from './engine';
import { flat } from './testUtils';

describe('KPI su serie costruite a mano', () => {
  it('mese critico = primo mese con cassa < 0', () => {
    expect(findCriticalMonth([100, 50, -10, 20, -30])).toBe(2);
    expect(findCriticalMonth([100, 50, 10])).toBeNull();
    expect(findCriticalMonth([-1])).toBe(0);
  });

  it('pareggio = primo mese da cui l’utile resta ≥ 0 per 3 mesi', () => {
    expect(findBreakEvenMonth([-5, -2, 1, -1, 3, 4, 5, 6])).toBe(4);
    expect(findBreakEvenMonth([1, 2, 3])).toBe(0);
    expect(findBreakEvenMonth([1, 2, -1, 4, 5])).toBeNull();
    expect(findBreakEvenMonth([-1, -1, -1, -1])).toBeNull();
  });

  it('runway', () => {
    expect(computeRunway([100, 200, 300], [100, 100, 100])).toBeNull();
    // flusso −100/mese, cassa 250 → negativa nel terzo mese (indice 2): due mesi interi
    expect(computeRunway([150, 50, -50], [-100, -100, -100])).toBe(2);
    // cassa resta positiva ma cala: 3 mesi + 300/100 = 6 mesi
    expect(computeRunway([500, 400, 300], [-100, -100, -100])).toBe(6);
  });

  it('KPI di una proiezione: cassa minima, margine, totali', () => {
    const p = project(flat({ cashStart: 1_000, rentMonthly: 11_000 }), [
      { kind: 'oneOffIncome', amount: 5_000, month: 4, label: 'Contributo' },
    ]);
    // flusso −1.000/mese, +5.000 ad aprile: cassa 0, −1.000, −2.000, +2.000, …, −6.000 a dicembre
    expect(p.kpis.criticalMonth).toBe(1);
    expect(p.kpis.cashMin).toBeCloseTo(-6_000, 6);
    expect(p.kpis.cashMinMonth).toBe(11);
    expect(p.kpis.marginPct).toBeCloseTo(-10, 6);
    expect(p.kpis.breakEvenMonth).toBeNull();
    expect(p.kpis.runwayMonths).toBe(1);
    expect(p.kpis.totalRevenue).toBeCloseTo(120_000, 6);
  });
});
