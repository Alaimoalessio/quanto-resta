import type { Assumptions, Lever } from './types';
import { calendarMonth } from './calendar';
import { formatEuro, monthLong } from '@/lib/format';

const pct = (v: number): string =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('it-IT')}%`;

/** Descrizione breve di una leva per le frasi del verdetto: "+5% sui prezzi", "un'assunzione da marzo". */
export function describeLever(lever: Lever, a: Pick<Assumptions, 'startMonth'>): string {
  const m = (t: number): string => monthLong(calendarMonth(a, t));
  switch (lever.kind) {
    case 'price':
      return `${pct(lever.pct)} sui prezzi`;
    case 'volume':
      return `${pct(lever.pct)} di clienti`;
    case 'hire':
      return `un'assunzione da ${m(lever.from)}`;
    case 'fire':
      return `una persona in meno da ${m(lever.from)}`;
    case 'openDays':
      return lever.extraDaysPerWeek === 1
        ? 'un giorno di apertura in più'
        : `${lever.extraDaysPerWeek} giorni di apertura in più`;
    case 'rent':
      return `l'affitto a ${formatEuro(lever.newRentMonthly)}`;
    case 'supplier':
      return lever.cogsPctDelta <= 0
        ? 'il cambio fornitore'
        : `costi di acquisto a ${pct(lever.cogsPctDelta)}`;
    case 'investment':
      return `un investimento di ${formatEuro(lever.amount)}${lever.financed ? ' a rate' : ''}`;
    case 'marketing':
      return `una campagna da ${m(lever.from)}`;
    case 'ownerDraw':
      return `il prelievo a ${formatEuro(lever.monthly)}`;
    case 'oneOffCost':
      return `una spesa di ${formatEuro(lever.amount)} a ${m(lever.month)}`;
    case 'oneOffIncome':
      return `un incasso di ${formatEuro(lever.amount)} a ${m(lever.month)}`;
  }
}

/** Etichetta corta per grafici e liste: "Prezzi +5%", "Assunzione (mar)". */
export function shortLabel(lever: Lever, a: Pick<Assumptions, 'startMonth'>): string {
  const m = (t: number): string => monthLong(calendarMonth(a, t)).slice(0, 3);
  switch (lever.kind) {
    case 'price':
      return `Prezzi ${pct(lever.pct)}`;
    case 'volume':
      return `Clienti ${pct(lever.pct)}`;
    case 'hire':
      return `Assunzione (${m(lever.from)})`;
    case 'fire':
      return `Meno personale (${m(lever.from)})`;
    case 'openDays':
      return `Giorni in più (${m(lever.from)})`;
    case 'rent':
      return `Affitto ${formatEuro(lever.newRentMonthly)}`;
    case 'supplier':
      return `Fornitore ${lever.cogsPctDelta > 0 ? '+' : '−'}${Math.abs(lever.cogsPctDelta)} pt`;
    case 'investment':
      return `Investimento ${formatEuro(lever.amount)}`;
    case 'marketing':
      return `Campagna (${m(lever.from)}–${m(lever.to)})`;
    case 'ownerDraw':
      return `Prelievo ${formatEuro(lever.monthly)}`;
    case 'oneOffCost':
      return lever.label || `Spesa (${m(lever.month)})`;
    case 'oneOffIncome':
      return lever.label || `Incasso (${m(lever.month)})`;
  }
}

/** Unisce elementi con virgole e "e": "a, b e c". */
export function joinItalian(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}
