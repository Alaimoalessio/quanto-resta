import { describe, expect, it } from 'vitest';
import { buildVerdict } from './verdict';
import { project } from './engine';
import { sensitivity } from './compare';
import type { Assumptions, Lever } from './types';
import { assumptionsFromTemplate } from '@/config/templates';
import { flat } from './testUtils';

const bar = assumptionsFromTemplate('bar', { startMonth: 1, startYear: 2026, horizonMonths: 12 });

function verdictFor(a: Assumptions, levers: Lever[]) {
  const base = project(a, []);
  const scenario = project(a, levers);
  return buildVerdict({
    assumptions: a,
    levers,
    base,
    scenario,
    sensitivity: sensitivity(a, levers, scenario),
  });
}

describe('verdetto', () => {
  it('senza leve descrive la base', () => {
    const v = verdictFor(bar, []);
    expect(v.tone).toBe('green');
    expect(v.sentences[0]).toMatch(/\*\*9\.980\s€\*\*/);
    expect(v.sentences.every((s) => !s.includes('!'))).toBe(true);
  });

  it('scenario positivo: esito verde con differenza e pareggio', () => {
    const v = verdictFor(bar, [{ kind: 'price', pct: 5, elasticity: 0.4, from: 2 }]);
    expect(v.tone).toBe('green');
    expect(v.sentences[0]).toMatch(
      /^Con \*\*\+5% sui prezzi\*\*, la cassa resta positiva tutto l'anno/,
    );
    expect(v.sentences[0]).toContain('in più rispetto a oggi');
  });

  it('cassa sotto zero: esito rosso con mese e causa', () => {
    const v = verdictFor(bar, [
      { kind: 'oneOffCost', amount: 12_000, month: 2, label: 'Macchina' },
      { kind: 'hire', costMonthly: 2_000, revenueUpliftPct: 0, from: 1 },
    ]);
    expect(v.tone).toBe('red');
    expect(v.sentences[0]).toContain('scende sotto zero a **febbraio**');
    expect(v.sentences.length).toBeGreaterThanOrEqual(2);
    expect(v.sentences.length).toBeLessThanOrEqual(4);
  });

  it('con due leve dice quale pesa di più', () => {
    const v = verdictFor(bar, [
      { kind: 'supplier', cogsPctDelta: -3, from: 1 },
      { kind: 'volume', pct: 1, from: 1 },
    ]);
    expect(
      v.sentences.some((s) => s.includes('La leva che pesa di più è **fornitore −3 pt**')),
    ).toBe(true);
  });

  it('base già in negativo', () => {
    const v = verdictFor(flat({ cashStart: 500, rentMonthly: 11_000 }), []);
    expect(v.tone).toBe('red');
    expect(v.sentences[0]).toMatch(
      /^Attenzione: già oggi la cassa scende sotto zero a \*\*gennaio\*\*/,
    );
  });

  it('leve senza effetto nell’orizzonte', () => {
    const v = verdictFor(bar, [{ kind: 'price', pct: 5, elasticity: 0.4, from: 13 }]);
    expect(v.tone).toBe('amber');
    expect(v.sentences[0]).toContain('non cambia nulla');
  });
});
