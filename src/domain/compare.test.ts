import { describe, expect, it } from 'vitest';
import { bisect, diffKpis, metrics, sensitivity, solveLever } from './compare';
import { project } from './engine';
import { flat } from './testUtils';
import { assumptionsFromTemplate } from '@/config/templates';

const bar = assumptionsFromTemplate('bar', { startMonth: 1, startYear: 2026, horizonMonths: 12 });

describe('confronto', () => {
  it('diff dei KPI', () => {
    const base = project(flat({ cashStart: 1_000 }), []);
    const sc = project(flat({ cashStart: 1_000 }), [{ kind: 'volume', pct: 10, from: 1 }]);
    const d = diffKpis(base.kpis, sc.kpis);
    expect(d.cashEnd).toBeCloseTo(12_000, 6);
    expect(d.totalRevenue).toBeCloseTo(12_000, 6);
    expect(d.runwayMonths).toBeNull();
  });

  it('sensibilità: ogni leva pesa quanto la sua assenza, ordinata per impatto', () => {
    const levers = [
      { kind: 'volume', pct: 1, from: 1 },
      { kind: 'oneOffCost', amount: 5_000, month: 2, label: 'Spesa' },
    ] as const;
    const items = sensitivity(flat(), [...levers]);
    expect(items[0].lever.kind).toBe('oneOffCost');
    expect(items[0].cashEndDelta).toBeCloseTo(-5_000, 6);
    expect(items[1].cashEndDelta).toBeCloseTo(1_200, 6);
  });
});

describe('goal seek', () => {
  it('bisezione su una funzione nota', () => {
    const r = bisect((x) => x * x, 2, 0, 2, 1e-6);
    expect(r).not.toBeNull();
    expect(r!.value).toBeCloseTo(Math.SQRT2, 5);
    expect(bisect((x) => x, 10, 0, 5)).toBeNull();
  });

  it('di quanto alzare i prezzi perché la cassa a dicembre sia ≥ 15.000 €, entro 0,1 punti', () => {
    const levers = [{ kind: 'price', pct: 0, elasticity: 0.4, from: 1 }] as const;
    const r = solveLever(bar, [...levers], 0, 'pct', metrics.cashAt(11), 15_000, [0, 50]);
    expect(r).not.toBeNull();
    const at = (pct: number): number =>
      project(bar, [{ kind: 'price', pct, elasticity: 0.4, from: 1 }]).months[11].cashEnd;
    expect(at(r!.value)).toBeGreaterThanOrEqual(15_000);
    expect(at(r!.value - 0.1)).toBeLessThan(15_000);
  });
});
