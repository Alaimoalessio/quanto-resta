'use client';

import type { Projections } from '@/store/selectors';
import type { View } from '@/store/scenario';
import { KpiTile } from './KpiTile';
import { Term } from '@/components/ui/Term';
import { formatEuro, formatPct, formatSignedEuro, formatSignedPct, monthLong } from '@/lib/format';

interface KpiStripProps {
  p: Projections;
  view: View;
}

function monthsDiff(v: number): string {
  const n = Math.abs(Math.round(v));
  const unit = n === 1 ? 'mese' : 'mesi';
  return v < 0 ? `${n} ${unit} prima` : `${n} ${unit} dopo`;
}

export function KpiStrip({ p, view }: KpiStripProps) {
  const shown = view === 'base' ? p.base : p.scenario;
  const k = shown.kpis;
  const withDelta = view === 'confronto' && p.levers.length > 0;
  const withYear = shown.months.length > 12;
  const monthName = (i: number): string => {
    const m = shown.months[i];
    return withYear ? `${monthLong(m.month)} ${String(m.year).slice(2)}` : monthLong(m.month);
  };

  return (
    <div className="sticky top-12 z-20 -mx-4 flex gap-3 overflow-x-auto bg-paper px-4 py-2 lg:static lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:bg-transparent lg:p-0">
      <KpiTile
        label="Cassa a fine periodo"
        value={k.cashEnd}
        format={formatEuro}
        tone={k.cashEnd < 0 ? 'bad' : 'neutral'}
        delta={withDelta ? { value: p.diff.cashEnd ?? 0, format: formatSignedEuro } : null}
        sparkline={{ values: shown.months.map((m) => m.cashEnd), zeroLine: true }}
      />
      <KpiTile
        label={
          <Term help="Il mese in cui la cassa tocca il punto più basso: se è sotto zero, lì mancano i soldi.">
            Punto più basso
          </Term>
        }
        value={k.cashMin}
        format={formatEuro}
        sub={`a ${monthName(k.cashMinMonth)}`}
        tone={k.cashMin < 0 ? 'bad' : 'neutral'}
        delta={withDelta ? { value: p.diff.cashMin ?? 0, format: formatSignedEuro } : null}
      />
      <KpiTile
        label={
          <Term help="Il primo mese da cui i ricavi coprono i costi per almeno tre mesi di fila.">
            Quando vai in pari
          </Term>
        }
        value={null}
        format={String}
        display={
          k.breakEvenMonth === null
            ? 'mai'
            : k.breakEvenMonth === 0
              ? 'già oggi'
              : monthName(k.breakEvenMonth)
        }
        tone={k.breakEvenMonth === null ? 'warn' : 'neutral'}
        delta={
          withDelta && p.diff.breakEvenMonth !== null
            ? { value: p.diff.breakEvenMonth, format: monthsDiff, goodWhenPositive: false }
            : null
        }
        sparkline={{ values: shown.months.map((m) => m.operatingProfit), zeroLine: true }}
      />
      <KpiTile
        label={
          <Term help="Quanto resta di ogni euro incassato dopo materie prime, personale e spese fisse, prima di tasse e prelievi.">
            Margine
          </Term>
        }
        value={k.marginPct}
        format={(v) => formatPct(v)}
        tone={k.marginPct < 0 ? 'bad' : 'neutral'}
        delta={
          withDelta
            ? { value: p.diff.marginPct ?? 0, format: (v) => `${formatSignedPct(v)} pt` }
            : null
        }
      />
    </div>
  );
}
