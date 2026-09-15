import { describe, expect, it } from 'vitest';
import { normalizeSeasonality, validateAssumptions } from './validate';
import { flat } from './testUtils';
import { templateList } from '@/config/templates';

describe('validazione', () => {
  it('i template sono validi', () => {
    for (const t of templateList) {
      const a = { ...t.assumptions, startMonth: 1, startYear: 2026, horizonMonths: 12 as const };
      expect(validateAssumptions(a)).toEqual([]);
    }
  });

  it('segnala stagionalità che non somma a 12 e valori fuori intervallo', () => {
    const bad = flat({
      seasonality: Array.from({ length: 12 }, () => 1.1),
      cogsPct: 120,
      startMonth: 13,
    });
    const fields = validateAssumptions(bad).map((i) => i.field);
    expect(fields).toContain('seasonality');
    expect(fields).toContain('cogsPct');
    expect(fields).toContain('startMonth');
  });

  it('normalizza la stagionalità mantenendo le proporzioni', () => {
    const n = normalizeSeasonality([2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(n.reduce((s, v) => s + v, 0)).toBeCloseTo(12, 9);
    expect(n[0] / n[1]).toBeCloseTo(2, 9);
  });
});
