'use client';

import { useMemo, useState } from 'react';
import { useScenarioStore } from '@/store/scenario';
import { useProjections } from '@/store/selectors';
import { CashCurve } from '@/charts/CashCurve';
import { MonthlyBars, type BarsMode } from '@/charts/MonthlyBars';
import { Tornado } from '@/charts/Tornado';
import { KpiStrip } from './KpiStrip';
import { Verdict } from './Verdict';
import { MonthDetail } from './MonthDetail';
import { Segmented } from '@/components/ui/Segmented';
import { shortLabel } from '@/domain/describe';
import { project } from '@/domain/engine';
import { formatEuro, monthLong } from '@/lib/format';

function Card({
  title,
  children,
  aside,
  dataChart,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  dataChart?: string;
}) {
  return (
    <section className="rounded border border-border bg-surface p-4" data-chart={dataChart}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wider text-secondary uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Dashboard() {
  const p = useProjections();
  const view = useScenarioStore((s) => s.view);
  const selected = useScenarioStore((s) => s.selectedMonth);
  const setSelected = useScenarioStore((s) => s.setSelectedMonth);
  const compareWith = useScenarioStore((s) => s.compareWith);
  const extra = useMemo(() => {
    if (!compareWith) return null;
    const values = project(
      compareWith.scenario.assumptions,
      compareWith.scenario.levers,
    ).months.map((m) => m.cashEnd);
    return { values, name: compareWith.name };
  }, [compareWith]);
  const [mode, setMode] = useState<BarsMode>('net');
  const hasLevers = p.levers.length > 0;
  const shown = view === 'base' ? p.base : p.scenario;
  const compare = view === 'confronto' && hasLevers;
  const k = shown.kpis;

  const cashDescription =
    k.criticalMonth === null
      ? `La cassa resta positiva e chiude a ${formatEuro(k.cashEnd)}.`
      : `La cassa scende sotto zero a ${monthLong(shown.months[k.criticalMonth].month)} e chiude a ${formatEuro(k.cashEnd)}.`;

  return (
    <div className="flex flex-col gap-5">
      <KpiStrip p={p} view={view} />
      <Verdict verdict={p.verdict} />

      <Card title="Quanto ti resta in cassa, mese per mese" dataChart="cash">
        <CashCurve
          labels={p.labels}
          base={p.base.months.map((m) => m.cashEnd)}
          scenario={shown.months.map((m) => m.cashEnd)}
          criticalMonth={k.criticalMonth}
          showBase={compare}
          extra={extra}
          description={cashDescription}
          height={300}
        />
        {!hasLevers && (
          <p className="mt-2 text-xs text-secondary">
            Nessuna leva attiva: aggiungine una per vedere cosa cambia.
          </p>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          title="Entrate e uscite"
          aside={
            <Segmented
              size="sm"
              label="Tipo di barre"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'net', label: 'Netto' },
                { value: 'inout', label: 'Entrate / uscite' },
              ]}
            />
          }
        >
          <MonthlyBars
            labels={p.labels}
            inflows={shown.months.map((m) => m.revenue + Math.max(0, -m.oneOffs))}
            outflows={shown.months.map((m) => m.revenue + Math.max(0, -m.oneOffs) - m.netCashFlow)}
            baseNet={compare ? p.base.months.map((m) => m.netCashFlow) : undefined}
            mode={mode}
            selected={selected}
            onSelect={setSelected}
            description="Entrate e uscite di ogni mese; clic su un mese per il dettaglio."
            height={220}
          />
          {selected !== null && (
            <MonthDetail
              label={p.labels[selected]}
              base={p.base.months[selected]}
              scenario={shown.months[selected]}
              compare={compare}
              onClose={() => setSelected(null)}
            />
          )}
        </Card>

        <Card title="Quale leva pesa di più">
          {p.sensitivity.length >= 2 ? (
            <Tornado
              items={p.sensitivity.map((s) => ({
                label: shortLabel(
                  s.lever,
                  p.scenario.months.length
                    ? { startMonth: shown.months[0].month }
                    : { startMonth: 1 },
                ),
                value: s.cashEndDelta,
              }))}
              description="Quanto ogni leva sposta la cassa a fine periodo, da sola."
            />
          ) : (
            <p className="py-6 text-center text-sm text-secondary">
              {hasLevers
                ? 'Con almeno due leve vedi quale pesa di più.'
                : 'Attiva almeno due leve per confrontarle.'}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
