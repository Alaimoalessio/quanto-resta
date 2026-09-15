import type { Assumptions, BusinessType } from '@/domain/types';

/**
 * Attività tipo con numeri di partenza plausibili per l'Italia. Gli ordini di
 * grandezza vengono da fonti pubbliche: rapporti annuali FIPE (bar e
 * ristorazione: fatturato medio per esercizio, incidenza di materie prime e
 * personale), Osservatorio Confcommercio (commercio al dettaglio non
 * alimentare), Confartigianato (impiantistica, costo del lavoro), Osservatorio
 * eCommerce B2c Netcomm (incidenza logistica e advertising). Sono medie
 * arrotondate, pensate per essere corrette dal titolare, non verità contabili.
 *
 * I costi del personale sono costi aziendali (lordo + contributi), non netti.
 * Le stagionalità sommano a 12: 1 = mese medio.
 */
export interface Template {
  type: BusinessType;
  label: string;
  description: string;
  assumptions: Omit<Assumptions, 'startMonth' | 'startYear' | 'horizonMonths'>;
}

export const templates: Record<BusinessType, Template> = {
  bar: {
    type: 'bar',
    label: 'Bar',
    description: 'Caffetteria di quartiere, due dipendenti, aperto sei giorni su sette.',
    assumptions: {
      businessType: 'bar',
      cashStart: 8_000,
      revenueMonthly: 14_000,
      seasonality: [0.9, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.15, 1.05, 1, 0.85, 0.9],
      cogsPct: 32,
      staff: { count: 2, costEachMonthly: 2_100 },
      rentMonthly: 1_400,
      utilitiesMonthly: 700,
      marketingMonthly: 150,
      otherFixedMonthly: 450,
      ownerDrawMonthly: 1_800,
      taxPct: 25,
    },
  },
  ristorante: {
    type: 'ristorante',
    label: 'Ristorante',
    description: 'Trattoria con 45 coperti, cinque persone in sala e cucina, chiuso a gennaio.',
    assumptions: {
      businessType: 'ristorante',
      cashStart: 15_000,
      revenueMonthly: 38_000,
      seasonality: [0.75, 0.85, 0.95, 1, 1.05, 1.2, 1.3, 1.3, 1.1, 1, 0.7, 0.8],
      cogsPct: 34,
      staff: { count: 5, costEachMonthly: 2_300 },
      rentMonthly: 2_800,
      utilitiesMonthly: 1_600,
      marketingMonthly: 400,
      otherFixedMonthly: 1_200,
      ownerDrawMonthly: 2_500,
      taxPct: 26,
    },
  },
  negozio: {
    type: 'negozio',
    label: 'Negozio',
    description: 'Abbigliamento in centro, una commessa, il Natale vale due mesi.',
    assumptions: {
      businessType: 'negozio',
      cashStart: 12_000,
      revenueMonthly: 22_000,
      seasonality: [1.05, 0.8, 0.9, 0.95, 1, 0.95, 1.05, 0.7, 1, 1.05, 0.95, 1.6],
      cogsPct: 52,
      staff: { count: 1, costEachMonthly: 2_000 },
      rentMonthly: 2_200,
      utilitiesMonthly: 600,
      marketingMonthly: 300,
      otherFixedMonthly: 900,
      ownerDrawMonthly: 2_000,
      taxPct: 24,
    },
  },
  artigiano: {
    type: 'artigiano',
    label: 'Artigiano',
    description: 'Impiantista con due operai e un furgone, agosto fermo.',
    assumptions: {
      businessType: 'artigiano',
      cashStart: 10_000,
      revenueMonthly: 26_000,
      seasonality: [0.95, 1, 1.05, 1.05, 1.1, 1.1, 1.05, 0.5, 1.1, 1.1, 1.05, 0.95],
      cogsPct: 45,
      staff: { count: 2, costEachMonthly: 2_600 },
      rentMonthly: 900,
      utilitiesMonthly: 400,
      marketingMonthly: 100,
      otherFixedMonthly: 1_800,
      ownerDrawMonthly: 2_600,
      taxPct: 27,
    },
  },
  studio: {
    type: 'studio',
    label: 'Studio professionale',
    description: 'Studio con una segretaria, parcelle mensili, agosto e dicembre corti.',
    assumptions: {
      businessType: 'studio',
      cashStart: 9_000,
      revenueMonthly: 12_000,
      seasonality: [1.05, 1.05, 1.05, 1.05, 1.05, 1.1, 1.05, 0.6, 1.05, 1.05, 1.1, 0.8],
      cogsPct: 5,
      staff: { count: 1, costEachMonthly: 1_900 },
      rentMonthly: 1_100,
      utilitiesMonthly: 300,
      marketingMonthly: 100,
      otherFixedMonthly: 700,
      ownerDrawMonthly: 3_000,
      taxPct: 30,
    },
  },
  ecommerce: {
    type: 'ecommerce',
    label: 'E-commerce',
    description:
      'Negozio online con magazzino, una persona alla logistica, vendite concentrate a fine anno.',
    assumptions: {
      businessType: 'ecommerce',
      cashStart: 14_000,
      revenueMonthly: 30_000,
      seasonality: [0.8, 0.75, 0.8, 0.85, 0.85, 0.8, 0.8, 0.7, 0.9, 1.05, 1.8, 1.9],
      cogsPct: 58,
      staff: { count: 1, costEachMonthly: 2_200 },
      rentMonthly: 600,
      utilitiesMonthly: 300,
      marketingMonthly: 3_500,
      otherFixedMonthly: 900,
      ownerDrawMonthly: 2_000,
      taxPct: 24,
    },
  },
};

export const templateList: Template[] = Object.values(templates);

/** Ipotesi complete a partire da un template, con calendario di default. */
export function assumptionsFromTemplate(
  type: BusinessType,
  calendar: Pick<Assumptions, 'startMonth' | 'startYear' | 'horizonMonths'>,
): Assumptions {
  return {
    ...templates[type].assumptions,
    seasonality: [...templates[type].assumptions.seasonality],
    ...calendar,
  };
}
