import type { Assumptions, Lever, LeverKind, Scenario } from './types';
import { BUSINESS_TYPES, LEVER_KINDS } from './types';

/**
 * Codifica compatta dello scenario per l'URL (`?s=…`). Non è JSON in base64:
 * sono numeri e indici separati, con la versione in testa, così un link resta
 * corto e leggibile. Alfabeto: cifre, lettere, `.` e `-` nei numeri, `~` tra i
 * gruppi, `_` tra i campi, `!` tra le leve, `*` nei testi. Nessuno di questi
 * caratteri viene alterato da `encodeURIComponent` o da `URLSearchParams`.
 */
export const SHARE_VERSION = 1;

const GROUP = '~';
const FIELD = '_';
const LEVER = '!';

/** Campi di ogni leva nell'ordine di codifica (il tipo è scritto per primo). */
const LEVER_FIELDS: Record<LeverKind, readonly string[]> = {
  price: ['pct', 'elasticity', 'from'],
  volume: ['pct', 'from'],
  hire: ['costMonthly', 'revenueUpliftPct', 'from'],
  fire: ['costMonthly', 'revenueDropPct', 'from'],
  openDays: ['extraDaysPerWeek', 'revenuePerDayPct', 'extraCostMonthly', 'from'],
  rent: ['newRentMonthly', 'from'],
  supplier: ['cogsPctDelta', 'from'],
  investment: [
    'amount',
    'from',
    'revenueUpliftPct',
    'upliftFrom',
    'financed.ratePct',
    'financed.months',
  ],
  marketing: ['monthly', 'from', 'to', 'revenueUpliftPct', 'lagMonths'],
  ownerDraw: ['monthly', 'from'],
  oneOffCost: ['amount', 'month', 'label'],
  oneOffIncome: ['amount', 'month', 'label'],
};

const TEXT_FIELDS = new Set(['label']);

// Testi in base64 con `+`→`.` e `/`→`*`, per non collidere con i separatori.
function encodeText(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '.').replace(/\//g, '*');
}

function decodeText(s: string): string {
  const b64 = s.replace(/\./g, '+').replace(/\*/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const num = (v: number | undefined): string => (v === undefined ? '' : String(v));

function parseNum(s: string): number | undefined {
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function encodeAssumptions(a: Assumptions): string {
  const head = [
    BUSINESS_TYPES.indexOf(a.businessType),
    a.startMonth,
    a.startYear,
    a.horizonMonths,
    a.cashStart,
    a.revenueMonthly,
    a.cogsPct,
    a.staff.count,
    a.staff.costEachMonthly,
    a.rentMonthly,
    a.utilitiesMonthly,
    a.marketingMonthly,
    a.otherFixedMonthly,
    a.ownerDrawMonthly,
    a.taxPct,
  ].map(num);
  const season = a.seasonality.map(num);
  const loan = a.loan
    ? [a.loan.principal, a.loan.ratePct, a.loan.months, a.loan.startMonth].map(num)
    : [];
  return [head.join(FIELD), season.join(FIELD), loan.join(FIELD)].join(GROUP);
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      obj,
    );
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

function encodeLever(l: Lever): string {
  const fields = LEVER_FIELDS[l.kind].map((f) => {
    const v = getPath(l as unknown as Record<string, unknown>, f);
    if (TEXT_FIELDS.has(f)) return encodeText(String(v ?? ''));
    return typeof v === 'number' ? num(v) : '';
  });
  return [LEVER_KINDS.indexOf(l.kind), ...fields].join(FIELD);
}

function decodeLever(s: string): Lever | null {
  const parts = s.split(FIELD);
  const kind = LEVER_KINDS[Number(parts[0])];
  if (!kind) return null;
  const fields = LEVER_FIELDS[kind];
  if (parts.length !== fields.length + 1) return null;
  const obj: Record<string, unknown> = { kind };
  fields.forEach((f, i) => {
    const raw = parts[i + 1];
    if (TEXT_FIELDS.has(f)) setPath(obj, f, decodeText(raw));
    else {
      const v = parseNum(raw);
      if (v !== undefined) setPath(obj, f, v);
    }
  });
  if (kind === 'investment' && obj.financed) {
    const fin = obj.financed as Record<string, unknown>;
    if (typeof fin.ratePct !== 'number' || typeof fin.months !== 'number') return null;
  }
  return obj as unknown as Lever;
}

export function encodeScenario(sc: Scenario): string {
  return [
    String(SHARE_VERSION),
    encodeAssumptions(sc.assumptions),
    sc.levers.map(encodeLever).join(LEVER),
    encodeText(sc.name),
  ].join(GROUP);
}

function decodeAssumptions(head: string, season: string, loan: string): Assumptions | null {
  const h = head.split(FIELD).map(parseNum);
  if (h.length !== 15 || h.some((v) => v === undefined)) return null;
  const n = h as number[];
  const businessType = BUSINESS_TYPES[n[0]];
  if (!businessType || (n[3] !== 12 && n[3] !== 24)) return null;
  const seasonality = season.split(FIELD).map(parseNum);
  if (seasonality.length !== 12 || seasonality.some((v) => v === undefined)) return null;
  const a: Assumptions = {
    businessType,
    startMonth: n[1],
    startYear: n[2],
    horizonMonths: n[3],
    cashStart: n[4],
    revenueMonthly: n[5],
    cogsPct: n[6],
    staff: { count: n[7], costEachMonthly: n[8] },
    rentMonthly: n[9],
    utilitiesMonthly: n[10],
    marketingMonthly: n[11],
    otherFixedMonthly: n[12],
    ownerDrawMonthly: n[13],
    taxPct: n[14],
    seasonality: seasonality as number[],
  };
  if (loan !== '') {
    const l = loan.split(FIELD).map(parseNum);
    if (l.length !== 4 || l.some((v) => v === undefined)) return null;
    const ln = l as number[];
    a.loan = { principal: ln[0], ratePct: ln[1], months: ln[2], startMonth: ln[3] };
  }
  return a;
}

/** Restituisce null se la stringa non è uno scenario valido. */
export function decodeScenario(s: string): Scenario | null {
  try {
    const groups = s.split(GROUP);
    if (groups.length !== 6 || Number(groups[0]) !== SHARE_VERSION) return null;
    const assumptions = decodeAssumptions(groups[1], groups[2], groups[3]);
    if (!assumptions) return null;
    const levers: Lever[] = [];
    if (groups[4] !== '') {
      for (const part of groups[4].split(LEVER)) {
        const l = decodeLever(part);
        if (!l) return null;
        levers.push(l);
      }
    }
    return { name: decodeText(groups[5]), assumptions, levers };
  } catch {
    return null;
  }
}
