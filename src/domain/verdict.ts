import type { Assumptions, Lever, Projection } from './types';
import type { SensitivityItem } from './compare';
import { describeLever, joinItalian, shortLabel } from './describe';
import { project } from './engine';
import { formatEuro, formatPct, monthLong } from '@/lib/format';

export type Tone = 'green' | 'amber' | 'red';

/** Frasi con i numeri tra `**` per il grassetto; 2–4 frasi, mai punti esclamativi. */
export interface Verdict {
  tone: Tone;
  sentences: string[];
}

export interface VerdictInput {
  assumptions: Assumptions;
  levers: Lever[];
  base: Projection;
  scenario: Projection;
  sensitivity: SensitivityItem[];
}

const b = (s: string): string => `**${s}**`;

function monthName(p: Projection, index: number): string {
  const m = p.months[index];
  const withYear = p.months.length > 12;
  return withYear ? `${monthLong(m.month)} ${m.year}` : monthLong(m.month);
}

function periodo(h: number): string {
  return h === 12 ? "tutto l'anno" : 'per tutti i 24 mesi';
}

function baseOnly({ base, assumptions }: VerdictInput): Verdict {
  const k = base.kpis;
  const s: string[] = [];
  if (k.criticalMonth !== null) {
    s.push(
      `Attenzione: già oggi la cassa scende sotto zero a ${b(monthName(base, k.criticalMonth))} (${b(formatEuro(k.cashMin))} nel punto più basso).`,
    );
    if (k.breakEvenMonth === null) s.push('I costi superano i ricavi: nessun trimestre in pari.');
    else
      s.push(
        `Il margine operativo è del ${b(formatPct(k.marginPct))}: il problema è la cassa, non i conti.`,
      );
    return { tone: 'red', sentences: s };
  }
  const delta = k.cashEnd - assumptions.cashStart;
  s.push(
    `Senza cambiare nulla la cassa chiude ${periodo(assumptions.horizonMonths)} a ${b(formatEuro(k.cashEnd))}, ${b(formatEuro(Math.abs(delta)))} in ${delta >= 0 ? 'più' : 'meno'} di oggi.`,
  );
  if (k.breakEvenMonth === null)
    s.push('Non vai in pari in nessun trimestre: i costi restano sopra i ricavi.');
  else s.push(`Il margine operativo è del ${b(formatPct(k.marginPct))}.`);
  return { tone: delta >= 0 && k.breakEvenMonth !== null ? 'green' : 'amber', sentences: s };
}

function breakEvenSentence(
  base: Projection,
  scenario: Projection,
): { text: string; amber: boolean } | null {
  const bm = base.kpis.breakEvenMonth;
  const sm = scenario.kpis.breakEvenMonth;
  if (bm === sm) return null;
  if (bm !== null && sm !== null) {
    if (sm < bm)
      return {
        text: `Il punto di pareggio arriva ${b(`a ${monthName(scenario, sm)} invece che a ${monthName(base, bm)}`)}.`,
        amber: false,
      };
    return {
      text: `Il punto di pareggio slitta ${b(`a ${monthName(scenario, sm)} da ${monthName(base, bm)}`)}.`,
      amber: true,
    };
  }
  if (sm !== null)
    return {
      text: `Con queste leve vai in pari da ${b(monthName(scenario, sm))}: oggi non ci arrivi.`,
      amber: false,
    };
  return { text: 'Con queste leve non vai più in pari entro l’orizzonte.', amber: true };
}

function causeOfShortfall(input: VerdictInput, critical: number): string {
  const { assumptions: a, base, scenario, levers } = input;
  const k = scenario.kpis;
  if (base.kpis.criticalMonth !== null && base.kpis.criticalMonth <= critical) {
    return `Il problema c'era già prima delle leve: senza, la cassa andava sotto zero a ${b(monthName(base, base.kpis.criticalMonth))}.`;
  }
  const monthIdx = scenario.months[critical].month - 1;
  const lowSeason =
    a.seasonality[monthIdx] < 0.9 ||
    (critical > 0 && a.seasonality[scenario.months[critical - 1].month - 1] < 0.9);
  if (lowSeason) {
    const culprit = levers.find(
      (l) =>
        (l.kind === 'hire' || l.kind === 'investment' || l.kind === 'openDays') &&
        l.from <= critical + 1,
    );
    let next = k.cashMinMonth + 1;
    while (next < scenario.months.length && a.seasonality[scenario.months[next].month - 1] < 1)
      next++;
    const suggestion =
      culprit && next < scenario.months.length
        ? `: valuta di spostare ${describeLever(culprit, a).replace(/ da .*$/, '')} a ${b(monthName(scenario, next))}`
        : `: in quei mesi servono ${b(formatEuro(-k.cashMin))} di cassa in più`;
    return `Il problema è la stagionalità di ${b(monthLong(scenario.months[critical].month))}, non le leve${suggestion}.`;
  }
  // La leva che pesa nel mese critico: senza di lei, quanto cambia la cassa proprio lì.
  let worst: { lever: Lever; delta: number } | null = null;
  levers.forEach((lever, i) => {
    const without = project(
      a,
      levers.filter((_, j) => j !== i),
    );
    const delta = scenario.months[critical].cashEnd - without.months[critical].cashEnd;
    if (delta < 0 && (!worst || delta < worst.delta)) worst = { lever, delta };
  });
  if (worst) {
    const w: { lever: Lever; delta: number } = worst;
    return `A pesare a ${monthLong(scenario.months[critical].month)} è ${b(shortLabel(w.lever, a).toLowerCase())}: senza, la cassa in quel mese sarebbe più alta di ${b(formatEuro(-w.delta))}; per restare sopra zero servirebbero ${b(formatEuro(-k.cashMin))} in più.`;
  }
  return `Per restare sopra zero servirebbero ${b(formatEuro(-k.cashMin))} di cassa in più.`;
}

export function buildVerdict(input: VerdictInput): Verdict {
  const { assumptions: a, levers, base, scenario, sensitivity } = input;
  if (levers.length === 0) return baseOnly(input);

  const intro = `Con ${joinItalian(levers.slice(0, 3).map((l) => b(describeLever(l, a))))}${levers.length > 3 ? ` e altre ${levers.length - 3} leve` : ''}`;
  const unchanged = scenario.months.every(
    (m, i) => Math.abs(m.cashEnd - base.months[i].cashEnd) < 0.5,
  );
  if (unchanged) {
    return {
      tone: 'amber',
      sentences: [
        `${intro} non cambia nulla nell'orizzonte scelto: controlla i mesi di inizio delle leve.`,
      ],
    };
  }

  const k = scenario.kpis;
  const s: string[] = [];
  let tone: Tone = 'green';

  if (k.criticalMonth !== null) {
    tone = 'red';
    s.push(
      `${intro}, la cassa scende sotto zero a ${b(monthName(scenario, k.criticalMonth))} (${b(formatEuro(k.cashMin))} nel punto più basso).`,
    );
    s.push(causeOfShortfall(input, k.criticalMonth));
  } else {
    const delta = k.cashEnd - base.kpis.cashEnd;
    const vs =
      Math.abs(delta) < 1
        ? 'come oggi'
        : `${b(formatEuro(Math.abs(delta)))} in ${delta >= 0 ? 'più' : 'meno'} rispetto a oggi`;
    s.push(
      `${intro}, la cassa resta positiva ${periodo(a.horizonMonths)} e chiude a ${b(formatEuro(k.cashEnd))}, ${vs}.`,
    );
    if (delta < 0) tone = 'amber';
    if (base.kpis.criticalMonth !== null) {
      s.push(
        `Senza le leve la cassa andava sotto zero a ${b(monthName(base, base.kpis.criticalMonth))}: il problema è risolto.`,
      );
    }
  }

  const be = breakEvenSentence(base, scenario);
  if (be) {
    s.push(be.text);
    if (be.amber && tone === 'green') tone = 'amber';
  }

  const top = sensitivity[0];
  const alreadyBlamed = s.some((t) => t.includes(shortLabel(top.lever, a).toLowerCase()));
  if (sensitivity.length >= 2 && s.length < 4 && !alreadyBlamed) {
    s.push(
      `La leva che pesa di più è ${b(shortLabel(top.lever, a).toLowerCase())}: da sola vale ${b(`${top.cashEndDelta >= 0 ? '+' : '−'}${formatEuro(Math.abs(top.cashEndDelta))}`)} sulla cassa a fine periodo.`,
    );
  }

  return { tone, sentences: s.slice(0, 4) };
}
