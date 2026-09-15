import { describe, expect, it } from 'vitest';
import { annuityPayment, project } from './engine';
import { flat } from './testUtils';
import { assumptionsFromTemplate, templateList } from '@/config/templates';
import { seasonalitySum } from './validate';

const bar = assumptionsFromTemplate('bar', { startMonth: 1, startYear: 2026, horizonMonths: 12 });

describe('bar senza leve (numeri calcolati a mano)', () => {
  // Ricavi 14.000 × stagionalità; cogs 32%; personale 4.200; fissi 1.400+700+450 = 2.550;
  // marketing 150; prelievo 1.800. Gen/Feb 0,90 · Mar 0,95 · Apr 1,00.
  const p = project(bar, []);
  const expected = [
    { revenue: 12_600, cogs: 4_032, operatingProfit: 1_668, netCashFlow: -132, cashEnd: 7_868 },
    { revenue: 12_600, cogs: 4_032, operatingProfit: 1_668, netCashFlow: -132, cashEnd: 7_736 },
    { revenue: 13_300, cogs: 4_256, operatingProfit: 2_144, netCashFlow: 344, cashEnd: 8_080 },
    { revenue: 14_000, cogs: 4_480, operatingProfit: 2_620, netCashFlow: 820, cashEnd: 8_900 },
  ];

  it('primi quattro mesi', () => {
    expected.forEach((e, i) => {
      const m = p.months[i];
      expect(m.revenue).toBeCloseTo(e.revenue, 6);
      expect(m.cogs).toBeCloseTo(e.cogs, 6);
      expect(m.staff).toBe(4_200);
      expect(m.fixed).toBe(2_550);
      expect(m.operatingProfit).toBeCloseTo(e.operatingProfit, 6);
      expect(m.taxes).toBe(0);
      expect(m.netCashFlow).toBeCloseTo(e.netCashFlow, 6);
      expect(m.cashEnd).toBeCloseTo(e.cashEnd, 6);
    });
  });

  it('anno intero: utile 31.440, tasse 7.860 a giugno/novembre, cassa finale 9.980', () => {
    // 168.000 − 53.760 − 50.400 − 30.600 − 1.800 = 31.440; 25% = 7.860 (40% giu, 60% nov)
    expect(p.kpis.totalRevenue).toBeCloseTo(168_000, 6);
    expect(p.kpis.totalProfit).toBeCloseTo(31_440, 6);
    expect(p.months[5].taxes).toBeCloseTo(3_144, 6);
    expect(p.months[10].taxes).toBeCloseTo(4_716, 6);
    expect(p.kpis.cashEnd).toBeCloseTo(8_000 + 31_440 - 7_860 - 21_600, 6);
  });

  it('cassa finale = cassa iniziale + Σ flussi', () => {
    const sum = p.months.reduce((s, m) => s + m.netCashFlow, 0);
    expect(p.kpis.cashEnd).toBeCloseTo(bar.cashStart + sum, 9);
  });

  it('la stagionalità di ogni template somma a 12', () => {
    for (const t of templateList)
      expect(seasonalitySum(t.assumptions.seasonality)).toBeCloseTo(12, 9);
  });

  it('calendario: mesi e anni corretti con inizio a novembre', () => {
    const q = project({ ...bar, startMonth: 11 }, []);
    expect(q.months[0]).toMatchObject({ month: 11, year: 2026 });
    expect(q.months[1]).toMatchObject({ month: 12, year: 2026 });
    expect(q.months[2]).toMatchObject({ month: 1, year: 2027 });
    expect(q.months[11]).toMatchObject({ month: 10, year: 2027 });
  });
});

describe('bar con prezzi +5%, elasticità 0,4 da febbraio', () => {
  // Fattore ricavi 1,05 × 0,98 = 1,029; il costo del venduto segue solo il volume (× 0,98).
  const p = project(bar, [{ kind: 'price', pct: 5, elasticity: 0.4, from: 2 }]);
  it('gennaio invariato, poi ricavi × 1,029 e cogs × 0,98', () => {
    expect(p.months[0].cashEnd).toBeCloseTo(7_868, 6);
    expect(p.months[1].revenue).toBeCloseTo(12_965.4, 6);
    expect(p.months[1].cogs).toBeCloseTo(3_951.36, 6);
    expect(p.months[1].operatingProfit).toBeCloseTo(2_114.04, 6);
    expect(p.months[1].cashEnd).toBeCloseTo(8_182.04, 6);
    expect(p.months[2].cashEnd).toBeCloseTo(8_996.86, 6);
    expect(p.months[3].revenue).toBeCloseTo(14_406, 6);
    expect(p.months[3].cashEnd).toBeCloseTo(10_312.46, 6);
  });
});

describe('leve singole', () => {
  it('prezzo +10% con elasticità 0,4: ricavi × 1,10 × (1 − 0,04)', () => {
    const p = project(flat({ cogsPct: 32 }), [
      { kind: 'price', pct: 10, elasticity: 0.4, from: 1 },
    ]);
    expect(p.months[0].revenue).toBeCloseTo(10_000 * 1.1 * 0.96, 6);
    expect(p.months[0].cogs).toBeCloseTo(0.32 * 10_000 * 0.96, 6);
  });

  it('assunzione da marzo: il costo del personale cambia da marzo e non prima', () => {
    const a = flat({
      cogsPct: 30,
      staff: { count: 1, costEachMonthly: 2_000 },
      rentMonthly: 1_000,
    });
    const p = project(a, [{ kind: 'hire', costMonthly: 1_500, revenueUpliftPct: 10, from: 3 }]);
    expect(p.months[0].staff).toBe(2_000);
    expect(p.months[1].staff).toBe(2_000);
    expect(p.months[1].operatingProfit).toBeCloseTo(4_000, 6);
    expect(p.months[2].staff).toBe(3_500);
    expect(p.months[2].revenue).toBeCloseTo(11_000, 6);
    expect(p.months[2].operatingProfit).toBeCloseTo(11_000 - 3_300 - 3_500 - 1_000, 6);
  });

  it('ammortamento francese: 10.000 € al 6% in 24 mesi → 443,21 €/mese', () => {
    expect(annuityPayment(10_000, 6, 24)).toBeCloseTo(443.21, 2);
    expect(annuityPayment(12_000, 0, 24)).toBe(500);
  });

  it('investimento finanziato: rata solo nei mesi del piano, nessun esborso iniziale', () => {
    const p = project(flat({ horizonMonths: 24 }), [
      {
        kind: 'investment',
        amount: 10_000,
        from: 3,
        revenueUpliftPct: 0,
        upliftFrom: 3,
        financed: { ratePct: 6, months: 12 },
      },
    ]);
    expect(p.months[1].loanPayment).toBe(0);
    expect(p.months[2].investment).toBe(0);
    expect(p.months[2].loanPayment).toBeCloseTo(annuityPayment(10_000, 6, 12), 9);
    expect(p.months[13].loanPayment).toBeCloseTo(annuityPayment(10_000, 6, 12), 9);
    expect(p.months[14].loanPayment).toBe(0);
    const totalPaid = p.months.reduce((s, m) => s + m.loanPayment, 0);
    expect(totalPaid).toBeGreaterThan(10_000);
    expect(totalPaid).toBeLessThan(10_400);
  });

  it('investimento cash: esce tutto nel mese scelto', () => {
    const p = project(flat(), [
      { kind: 'investment', amount: 5_000, from: 2, revenueUpliftPct: 10, upliftFrom: 4 },
    ]);
    expect(p.months[0].investment).toBe(0);
    expect(p.months[1].investment).toBe(5_000);
    expect(p.months[1].cashEnd).toBeCloseTo(10_000 + 10_000 - 5_000, 6);
    expect(p.months[2].revenue).toBe(10_000);
    expect(p.months[3].revenue).toBeCloseTo(11_000, 6);
  });

  it('campagna: spesa da marzo a maggio, effetto con un mese di ritardo', () => {
    const p = project(flat(), [
      { kind: 'marketing', monthly: 500, from: 3, to: 5, revenueUpliftPct: 10, lagMonths: 1 },
    ]);
    expect(p.months[1].marketing).toBe(0);
    expect(p.months[2].marketing).toBe(500);
    expect(p.months[2].revenue).toBe(10_000);
    expect(p.months[3].revenue).toBeCloseTo(11_000, 6);
    expect(p.months[4].marketing).toBe(500);
    expect(p.months[5].marketing).toBe(0);
    expect(p.months[5].revenue).toBeCloseTo(11_000, 6);
    expect(p.months[6].revenue).toBe(10_000);
  });

  it('una tantum, affitto, prelievo, fornitore, giorni in più', () => {
    const a = flat({ cogsPct: 30, rentMonthly: 1_000, ownerDrawMonthly: 1_000 });
    const p = project(a, [
      { kind: 'oneOffCost', amount: 2_000, month: 2, label: 'Frigo' },
      { kind: 'oneOffIncome', amount: 500, month: 2, label: 'Rimborso' },
      { kind: 'rent', newRentMonthly: 800, from: 3 },
      { kind: 'ownerDraw', monthly: 1_500, from: 3 },
      { kind: 'supplier', cogsPctDelta: -3, from: 4 },
      {
        kind: 'openDays',
        extraDaysPerWeek: 1,
        revenuePerDayPct: 10,
        extraCostMonthly: 300,
        from: 5,
      },
    ]);
    expect(p.months[1].oneOffs).toBe(1_500);
    expect(p.months[2].fixed).toBe(800);
    expect(p.months[2].ownerDraw).toBe(1_500);
    expect(p.months[3].cogs).toBeCloseTo(2_700, 6);
    expect(p.months[4].revenue).toBeCloseTo(11_000, 6);
    expect(p.months[4].cogs).toBeCloseTo(11_000 * 0.27, 6);
    expect(p.months[4].fixed).toBe(1_100);
  });

  it('le leve si combinano in modo moltiplicativo e indipendente dall’ordine', () => {
    const l1 = { kind: 'price', pct: 10, elasticity: 0.5, from: 1 } as const;
    const l2 = { kind: 'volume', pct: 20, from: 1 } as const;
    const p = project(flat(), [l1, l2]);
    const q = project(flat(), [l2, l1]);
    expect(p.months[0].revenue).toBeCloseTo(10_000 * 1.1 * 0.95 * 1.2, 6);
    expect(q.months[0].revenue).toBeCloseTo(p.months[0].revenue, 9);
  });
});

describe('tasse', () => {
  it('pagate solo a giugno (40%) e novembre (60%)', () => {
    // utile 6.000/mese × 12 = 72.000; 20% = 14.400
    const p = project(flat({ rentMonthly: 4_000, taxPct: 20 }), []);
    p.months.forEach((m) => {
      if (m.month === 6) expect(m.taxes).toBeCloseTo(5_760, 6);
      else if (m.month === 11) expect(m.taxes).toBeCloseTo(8_640, 6);
      else expect(m.taxes).toBe(0);
    });
  });

  it('mai su utile negativo', () => {
    const p = project(flat({ rentMonthly: 12_000, taxPct: 20 }), []);
    expect(p.months.every((m) => m.taxes === 0)).toBe(true);
  });

  it('per anno solare: con inizio a luglio ogni anno paga solo le scadenze nell’orizzonte', () => {
    const p = project(flat({ startMonth: 7, rentMonthly: 4_000, taxPct: 20 }), []);
    // 2026: lug–dic = 36.000 → 7.200, solo il 60% di novembre; 2027: gen–giu = 36.000 → 40% di giugno
    expect(p.months[4].taxes).toBeCloseTo(4_320, 6);
    expect(p.months[11].taxes).toBeCloseTo(2_880, 6);
    expect(p.months.reduce((s, m) => s + m.taxes, 0)).toBeCloseTo(7_200, 6);
  });
});

describe('prestazioni', () => {
  it('24 mesi con 8 leve in meno di 2 ms', () => {
    const a = flat({ horizonMonths: 24 });
    const levers = [
      { kind: 'price', pct: 5, elasticity: 0.4, from: 2 },
      { kind: 'volume', pct: 10, from: 3 },
      { kind: 'hire', costMonthly: 2_000, revenueUpliftPct: 8, from: 4 },
      {
        kind: 'openDays',
        extraDaysPerWeek: 1,
        revenuePerDayPct: 12,
        extraCostMonthly: 500,
        from: 2,
      },
      { kind: 'supplier', cogsPctDelta: -3, from: 5 },
      {
        kind: 'investment',
        amount: 10_000,
        from: 3,
        revenueUpliftPct: 5,
        upliftFrom: 4,
        financed: { ratePct: 6, months: 24 },
      },
      { kind: 'marketing', monthly: 800, from: 4, to: 6, revenueUpliftPct: 6, lagMonths: 1 },
      { kind: 'oneOffCost', amount: 3_000, month: 9, label: 'Riparazione' },
    ] as const;
    for (let i = 0; i < 50; i++) project(a, [...levers]);
    const runs = 500;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) project(a, [...levers]);
    const avgMs = (performance.now() - t0) / runs;
    expect(avgMs).toBeLessThan(2);
  });
});
