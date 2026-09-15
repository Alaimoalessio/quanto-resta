import type { LeverKind } from '@/domain/types';

export type Unit = '€' | '%' | 'punti' | 'x' | 'mesi' | 'giorni' | 'mese';
export type ChartHighlight = 'cash' | 'bars' | 'tornado';

export interface LeverControl {
  key: string; // campo della leva (anche annidato: "financed.ratePct")
  label: string;
  unit: Unit;
  min: number;
  max: number;
  step: number;
  help?: string; // tooltip di una riga per i termini tecnici
}

export interface LeverDefinition {
  kind: LeverKind;
  label: string; // da titolare: "Alzo i prezzi"
  description: string; // una riga che spiega l'effetto
  highlights: ChartHighlight[]; // quale grafico si illumina quando la leva è attiva
  controls: LeverControl[];
}

const month = (key: string, label: string): LeverControl => ({
  key,
  label,
  unit: 'mese',
  min: 1,
  max: 24,
  step: 1,
});

export const leverCatalog: Record<LeverKind, LeverDefinition> = {
  price: {
    kind: 'price',
    label: 'Alzo i prezzi',
    description:
      'Ogni 1% di aumento fa perdere in media una quota di clienti: è l’elasticità, e puoi cambiarla.',
    highlights: ['cash', 'bars'],
    controls: [
      { key: 'pct', label: 'Variazione dei prezzi', unit: '%', min: -30, max: 50, step: 0.5 },
      {
        key: 'elasticity',
        label: 'Elasticità',
        unit: 'x',
        min: 0,
        max: 3,
        step: 0.1,
        help: 'Quanti clienti perdi per ogni 1% di aumento: 0,4 vuol dire che +10% di prezzo costa il 4% dei clienti.',
      },
      month('from', 'Da quando'),
    ],
  },
  volume: {
    kind: 'volume',
    label: 'Aumento i clienti',
    description:
      'Più clienti a parità di prezzo: una vetrina nuova, il passaparola, un canale in più.',
    highlights: ['cash', 'bars'],
    controls: [
      { key: 'pct', label: 'Variazione dei clienti', unit: '%', min: -50, max: 100, step: 1 },
      month('from', 'Da quando'),
    ],
  },
  hire: {
    kind: 'hire',
    label: 'Assumo una persona',
    description:
      'Il costo aziendale parte dal mese scelto; l’aumento di incassi è quello che ti aspetti da una persona in più.',
    highlights: ['cash', 'bars'],
    controls: [
      {
        key: 'costMonthly',
        label: 'Costo aziendale al mese',
        unit: '€',
        min: 0,
        max: 8_000,
        step: 50,
        help: 'Lordo più contributi, non lo stipendio netto.',
      },
      { key: 'revenueUpliftPct', label: 'Incassi in più', unit: '%', min: 0, max: 100, step: 1 },
      month('from', 'Da quando'),
    ],
  },
  fire: {
    kind: 'fire',
    label: 'Riduco il personale',
    description: 'Risparmi il costo dal mese scelto, ma qualche incasso lo perdi.',
    highlights: ['cash', 'bars'],
    controls: [
      {
        key: 'costMonthly',
        label: 'Costo aziendale risparmiato',
        unit: '€',
        min: 0,
        max: 8_000,
        step: 50,
      },
      { key: 'revenueDropPct', label: 'Incassi persi', unit: '%', min: 0, max: 50, step: 1 },
      month('from', 'Da quando'),
    ],
  },
  openDays: {
    kind: 'openDays',
    label: 'Apro un giorno in più',
    description:
      'Un giorno in più a settimana non vale un settimo degli incassi: decidi tu quanto.',
    highlights: ['cash', 'bars'],
    controls: [
      {
        key: 'extraDaysPerWeek',
        label: 'Giorni in più a settimana',
        unit: 'giorni',
        min: 1,
        max: 2,
        step: 1,
      },
      {
        key: 'revenuePerDayPct',
        label: 'Incassi per giorno in più',
        unit: '%',
        min: 0,
        max: 20,
        step: 1,
        help: 'In percentuale degli incassi attuali: 12% vuol dire che la domenica rende un po’ meno di un giorno medio.',
      },
      {
        key: 'extraCostMonthly',
        label: 'Costi in più al mese',
        unit: '€',
        min: 0,
        max: 5_000,
        step: 50,
      },
      month('from', 'Da quando'),
    ],
  },
  rent: {
    kind: 'rent',
    label: 'Cambio affitto',
    description: 'Rinegozi il canone o ti sposti: il nuovo affitto vale dal mese scelto.',
    highlights: ['cash'],
    controls: [
      {
        key: 'newRentMonthly',
        label: 'Nuovo affitto al mese',
        unit: '€',
        min: 0,
        max: 20_000,
        step: 50,
      },
      month('from', 'Da quando'),
    ],
  },
  supplier: {
    kind: 'supplier',
    label: 'Cambio fornitore',
    description: 'Quanto cambia il costo del venduto, in punti percentuali sui ricavi.',
    highlights: ['cash', 'bars'],
    controls: [
      {
        key: 'cogsPctDelta',
        label: 'Costo del venduto',
        unit: 'punti',
        min: -15,
        max: 15,
        step: 0.5,
        help: 'Punti percentuali sui ricavi: −3 vuol dire passare dal 32% al 29%.',
      },
      month('from', 'Da quando'),
    ],
  },
  investment: {
    kind: 'investment',
    label: 'Compro un macchinario',
    description:
      'Lo paghi subito o a rate (ammortamento francese); gli incassi in più arrivano da quando lo usi.',
    highlights: ['cash', 'tornado'],
    controls: [
      { key: 'amount', label: 'Importo', unit: '€', min: 0, max: 200_000, step: 500 },
      month('from', 'Quando lo compro'),
      { key: 'revenueUpliftPct', label: 'Incassi in più', unit: '%', min: 0, max: 100, step: 1 },
      month('upliftFrom', 'Da quando rende'),
      {
        key: 'financed.ratePct',
        label: 'Tasso annuo',
        unit: '%',
        min: 0,
        max: 15,
        step: 0.25,
        help: 'Tasso annuo nominale del finanziamento; la rata è calcolata con l’ammortamento francese.',
      },
      { key: 'financed.months', label: 'Durata', unit: 'mesi', min: 6, max: 120, step: 6 },
    ],
  },
  marketing: {
    kind: 'marketing',
    label: 'Faccio una campagna',
    description:
      'Spendi per qualche mese; l’effetto arriva con un po’ di ritardo e dura quanto la campagna.',
    highlights: ['cash', 'bars'],
    controls: [
      { key: 'monthly', label: 'Spesa al mese', unit: '€', min: 0, max: 20_000, step: 50 },
      month('from', 'Da quando'),
      month('to', 'Fino a quando'),
      { key: 'revenueUpliftPct', label: 'Incassi in più', unit: '%', min: 0, max: 100, step: 1 },
      { key: 'lagMonths', label: 'Ritardo dell’effetto', unit: 'mesi', min: 0, max: 6, step: 1 },
    ],
  },
  ownerDraw: {
    kind: 'ownerDraw',
    label: 'Cambio il mio prelievo',
    description: 'Quanto prelevi ogni mese per vivere, dal mese scelto in poi.',
    highlights: ['cash'],
    controls: [
      { key: 'monthly', label: 'Prelievo al mese', unit: '€', min: 0, max: 20_000, step: 50 },
      month('from', 'Da quando'),
    ],
  },
  oneOffCost: {
    kind: 'oneOffCost',
    label: 'Spesa una tantum',
    description: 'Una spesa secca in un mese preciso: una riparazione, uno stock, una multa.',
    highlights: ['cash'],
    controls: [
      { key: 'amount', label: 'Importo', unit: '€', min: 0, max: 200_000, step: 100 },
      month('month', 'Quando'),
    ],
  },
  oneOffIncome: {
    kind: 'oneOffIncome',
    label: 'Incasso una tantum',
    description:
      'Un incasso secco in un mese preciso: un contributo, un rimborso, una vendita straordinaria.',
    highlights: ['cash'],
    controls: [
      { key: 'amount', label: 'Importo', unit: '€', min: 0, max: 200_000, step: 100 },
      month('month', 'Quando'),
    ],
  },
};

export const leverList: LeverDefinition[] = Object.values(leverCatalog);
