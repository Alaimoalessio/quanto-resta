import type { BusinessType, Lever } from '@/domain/types';

/** Le tre domande che si fa chi ha quell'attività, con la leva già impostata. */
export interface SuggestedLever {
  question: string;
  lever: Lever;
}

export const suggestedLevers: Record<BusinessType, SuggestedLever[]> = {
  bar: [
    {
      question: 'Alzo il caffè di 10 centesimi?',
      lever: { kind: 'price', pct: 5, elasticity: 0.4, from: 2 },
    },
    {
      question: 'Assumo un aiuto per la stagione?',
      lever: { kind: 'hire', costMonthly: 1_900, revenueUpliftPct: 8, from: 5 },
    },
    {
      question: 'Apro anche la domenica?',
      lever: {
        kind: 'openDays',
        extraDaysPerWeek: 1,
        revenuePerDayPct: 12,
        extraCostMonthly: 600,
        from: 3,
      },
    },
  ],
  ristorante: [
    {
      question: 'Alzo il menu del 5%?',
      lever: { kind: 'price', pct: 5, elasticity: 0.5, from: 3 },
    },
    {
      question: 'Cambio fornitore di carne e pesce?',
      lever: { kind: 'supplier', cogsPctDelta: -3, from: 2 },
    },
    {
      question: 'Faccio una campagna prima dell’estate?',
      lever: {
        kind: 'marketing',
        monthly: 800,
        from: 4,
        to: 6,
        revenueUpliftPct: 6,
        lagMonths: 1,
      },
    },
  ],
  negozio: [
    {
      question: 'Rifaccio la vetrina e apro il negozio online?',
      lever: { kind: 'volume', pct: 10, from: 3 },
    },
    { question: 'Rinegozio l’affitto?', lever: { kind: 'rent', newRentMonthly: 1_800, from: 7 } },
    {
      question: 'Spingo sui social prima di Natale?',
      lever: {
        kind: 'marketing',
        monthly: 600,
        from: 10,
        to: 12,
        revenueUpliftPct: 8,
        lagMonths: 1,
      },
    },
  ],
  artigiano: [
    {
      question: 'Compro un secondo furgone attrezzato a rate?',
      lever: {
        kind: 'investment',
        amount: 18_000,
        from: 2,
        revenueUpliftPct: 5,
        upliftFrom: 3,
        financed: { ratePct: 5, months: 36 },
      },
    },
    {
      question: 'Assumo un terzo operaio?',
      lever: { kind: 'hire', costMonthly: 2_600, revenueUpliftPct: 25, from: 3 },
    },
    {
      question: 'Alzo le tariffe del 5%?',
      lever: { kind: 'price', pct: 5, elasticity: 0.2, from: 1 },
    },
  ],
  studio: [
    {
      question: 'Alzo le parcelle dell’8%?',
      lever: { kind: 'price', pct: 8, elasticity: 0.3, from: 1 },
    },
    {
      question: 'Prendo un collaboratore?',
      lever: { kind: 'hire', costMonthly: 1_900, revenueUpliftPct: 20, from: 3 },
    },
    {
      question: 'Riduco il mio prelievo per sei mesi?',
      lever: { kind: 'ownerDraw', monthly: 2_500, from: 1 },
    },
  ],
  ecommerce: [
    {
      question: 'Raddoppio le inserzioni prima del Black Friday?',
      lever: {
        kind: 'marketing',
        monthly: 3_000,
        from: 9,
        to: 11,
        revenueUpliftPct: 15,
        lagMonths: 1,
      },
    },
    {
      question: 'Cambio fornitore e risparmio 4 punti?',
      lever: { kind: 'supplier', cogsPctDelta: -4, from: 4 },
    },
    {
      question: 'Compro lo stock di Natale in anticipo?',
      lever: { kind: 'oneOffCost', amount: 6_000, month: 9, label: 'Stock di Natale' },
    },
  ],
};
