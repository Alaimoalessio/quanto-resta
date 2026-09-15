'use client';

import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore } from '@/store/scenario';
import { templates } from '@/config/templates';
import { LIMITS, seasonalitySum, validateAssumptions } from '@/domain/validate';
import type { Assumptions } from '@/domain/types';
import { NumberInput } from '@/components/ui/NumberInput';
import { Segmented } from '@/components/ui/Segmented';
import { Term } from '@/components/ui/Term';
import { SeasonalityBars } from './SeasonalityBars';
import { MONTHS_LONG } from '@/lib/format';

type NumericKey =
  | 'cashStart'
  | 'revenueMonthly'
  | 'cogsPct'
  | 'rentMonthly'
  | 'utilitiesMonthly'
  | 'marketingMonthly'
  | 'otherFixedMonthly'
  | 'ownerDrawMonthly'
  | 'taxPct';

interface Row {
  key: NumericKey;
  label: string;
  help?: string;
  unit: '€' | '%';
  max: number;
  min?: number;
  step?: number;
}

const ROWS: Row[] = [
  {
    key: 'cashStart',
    label: 'Cassa oggi',
    help: 'Quello che hai in banca e in cassa adesso, al netto di quello che devi già pagare.',
    unit: '€',
    min: LIMITS.cashStart.min,
    max: LIMITS.cashStart.max,
    step: 100,
  },
  {
    key: 'revenueMonthly',
    label: 'Incasso medio al mese',
    help: 'Ricavi mensili medi, IVA esclusa: la stagionalità qui sotto li alza o abbassa mese per mese.',
    unit: '€',
    max: LIMITS.revenueMonthly.max,
    step: 100,
  },
  {
    key: 'cogsPct',
    label: 'Materie prime e merce',
    help: 'Quanto ti costa quello che vendi, in percentuale degli incassi: caffè e brioche per un bar, la merce per un negozio.',
    unit: '%',
    max: LIMITS.cogsPct.max,
    step: 0.5,
  },
  { key: 'rentMonthly', label: 'Affitto', unit: '€', max: LIMITS.monthlyCost.max, step: 50 },
  { key: 'utilitiesMonthly', label: 'Utenze', unit: '€', max: LIMITS.monthlyCost.max, step: 50 },
  { key: 'marketingMonthly', label: 'Marketing', unit: '€', max: LIMITS.monthlyCost.max, step: 50 },
  {
    key: 'otherFixedMonthly',
    label: 'Altre spese fisse',
    help: 'Commercialista, assicurazioni, software, manutenzioni, tutto quello che paghi anche se non incassi.',
    unit: '€',
    max: LIMITS.monthlyCost.max,
    step: 50,
  },
  {
    key: 'ownerDrawMonthly',
    label: 'Il tuo prelievo',
    help: 'Quanto togli ogni mese dalla cassa per vivere.',
    unit: '€',
    max: LIMITS.monthlyCost.max,
    step: 50,
  },
  {
    key: 'taxPct',
    label: 'Tasse sull’utile',
    help: 'Aliquota effettiva stimata sull’utile operativo; il tuo commercialista te la dice in un minuto.',
    unit: '%',
    max: LIMITS.taxPct.max,
    step: 1,
  },
];

const HORIZONS = [
  { value: '12', label: '12 mesi' },
  { value: '24', label: '24 mesi' },
];

/** Passo 2: numeri di partenza modificabili inline, con stagionalità e calendario. */
export function NumbersReview() {
  const { a, update, setSeason } = useScenarioStore(
    useShallow((s) => ({
      a: s.assumptions,
      update: s.updateAssumptions,
      setSeason: s.setSeasonalityAt,
    })),
  );
  const issues = validateAssumptions(a);
  const errorFor = (field: string): string | undefined =>
    issues.find((i) => i.field === field)?.message;
  const avg = seasonalitySum(a.seasonality) / 12;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section aria-label="Numeri di partenza">
        <table className="tnum w-full text-sm">
          <tbody>
            {ROWS.map((r) => {
              const err = errorFor(r.key);
              return (
                <tr key={r.key} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-ink">
                    {r.help ? <Term help={r.help}>{r.label}</Term> : r.label}
                    {err && <span className="block text-xs text-danger">{err}</span>}
                  </th>
                  <td className="w-40 py-1">
                    <NumberInput
                      label={r.label}
                      value={a[r.key]}
                      onChange={(v) => update({ [r.key]: v } as Partial<Assumptions>)}
                      min={r.min ?? 0}
                      max={r.max}
                      step={r.step}
                      unit={r.unit}
                      decimals={r.unit === '%' ? 1 : 0}
                    />
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-border">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <Term help="Costo aziendale, non lo stipendio netto: lordo più contributi.">
                  Personale
                </Term>
              </th>
              <td className="w-40 py-1">
                <span className="flex items-center gap-1">
                  <NumberInput
                    label="Numero di persone"
                    value={a.staff.count}
                    onChange={(v) => update({ staff: { ...a.staff, count: Math.round(v) } })}
                    min={0}
                    max={LIMITS.staffCount.max}
                    step={1}
                    decimals={0}
                    className="w-14"
                  />
                  <span className="text-xs text-secondary">×</span>
                  <NumberInput
                    label="Costo mensile per persona"
                    value={a.staff.costEachMonthly}
                    onChange={(v) => update({ staff: { ...a.staff, costEachMonthly: v } })}
                    min={0}
                    max={LIMITS.staffCost.max}
                    step={50}
                    unit="€"
                    decimals={0}
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <h3 className="text-xs font-medium tracking-wider text-secondary uppercase">
              Stagionalità
            </h3>
            <span className="tnum text-xs text-secondary">
              {Math.abs(avg - 1) < 0.005
                ? 'media annua 1,00'
                : `media annua ${avg.toLocaleString('it-IT', { maximumFractionDigits: 2 })}: la riporto a 1`}
            </span>
          </div>
          <p className="mb-3 text-xs text-secondary">
            Trascina le barrette: la linea tratteggiata è un mese medio, il doppio vale il doppio
            degli incassi.
          </p>
          <SeasonalityBars values={a.seasonality} onChange={setSeason} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium tracking-wider text-secondary uppercase">
            Parto da
            <select
              value={a.startMonth}
              onChange={(e) => update({ startMonth: Number(e.target.value) })}
              className="h-9 rounded border border-border bg-surface px-2 text-sm font-normal tracking-normal text-ink normal-case"
            >
              {MONTHS_LONG.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m} {i + 1 < a.startMonth ? a.startYear + 1 : a.startYear}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs font-medium tracking-wider text-secondary uppercase">
            Orizzonte
            <Segmented
              label="Orizzonte"
              value={String(a.horizonMonths)}
              options={HORIZONS}
              onChange={(v) => update({ horizonMonths: v === '24' ? 24 : 12 })}
            />
          </div>
        </div>
        <p className="text-xs text-secondary">
          Numeri di partenza tipici per {templates[a.businessType].label.toLowerCase()} in Italia
          (ordini di grandezza da FIPE, Confcommercio, Confartigianato): sono un punto di partenza,
          non una verità.
        </p>
      </section>
    </div>
  );
}
