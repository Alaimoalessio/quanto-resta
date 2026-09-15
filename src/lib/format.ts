const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
});
const euroCents = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
});
const number = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });
const upToOne = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const minus = (s: string): string => s.replace('-', '−');

export const formatEuro = (v: number): string => minus(euro.format(Math.round(v) === 0 ? 0 : v));
export const formatEuroCents = (v: number): string => minus(euroCents.format(v));
export const formatNumber = (v: number): string => minus(number.format(v));
export const formatDecimal = (v: number): string => decimal.format(v);

/** Delta con segno esplicito: "+1.200 €", "−350 €". Il meno è tipografico. */
export function formatSignedEuro(v: number): string {
  const r = Math.round(v);
  if (r === 0) return '0 €';
  return (r > 0 ? '+' : '−') + euro.format(Math.abs(r));
}

export const formatPct = (v: number, digits = 1): string =>
  `${v.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export function formatSignedPct(v: number, digits = 1): string {
  if (Math.abs(v) < 10 ** -digits / 2) return `0${digits ? ',' + '0'.repeat(digits) : ''}%`;
  return (v > 0 ? '+' : '−') + formatPct(Math.abs(v), digits);
}

/** Formattazione compatta per assi e sparkline: 12k, 1,2M, −800. */
export function formatCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}${upToOne.format(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}${number.format(Math.round(abs / 1000))}k`;
  if (abs >= 1_000) return `${sign}${upToOne.format(abs / 1000)}k`;
  return `${sign}${number.format(abs)}`;
}

export const MONTHS_SHORT = [
  'gen',
  'feb',
  'mar',
  'apr',
  'mag',
  'giu',
  'lug',
  'ago',
  'set',
  'ott',
  'nov',
  'dic',
];
export const MONTHS_LONG = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

export const monthShort = (month: number): string => MONTHS_SHORT[(month - 1) % 12];
export const monthLong = (month: number): string => MONTHS_LONG[(month - 1) % 12];

/** "gen ’27" dove serve l'anno, altrimenti solo "gen". */
export function monthLabel(month: number, year: number, withYear: boolean): string {
  return withYear ? `${monthShort(month)} ’${String(year).slice(2)}` : monthShort(month);
}
