import { formatEuro, formatSignedEuro } from '@/lib/format';

interface CashTooltipRowsProps {
  label: string;
  base: number | null;
  scenario: number;
  extra: { name: string; value: number } | null;
  names: { base: string; scenario: string };
}

/** Righe del tooltip della curva di cassa: base, scenario, differenza. */
export function CashTooltipRows({ label, base, scenario, extra, names }: CashTooltipRowsProps) {
  return (
    <>
      <div className="mb-1 font-medium capitalize">{label}</div>
      {base !== null && (
        <div className="flex justify-between gap-4 text-secondary">
          <span>{names.base}</span>
          <span>{formatEuro(base)}</span>
        </div>
      )}
      {extra && (
        <div className="flex justify-between gap-4 text-secondary">
          <span>{extra.name}</span>
          <span>{formatEuro(extra.value)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span>{names.scenario}</span>
        <span className="font-medium">{formatEuro(scenario)}</span>
      </div>
      {base !== null && (
        <div className="mt-1 flex justify-between gap-4 border-t border-border pt-1">
          <span>Differenza</span>
          <span className={scenario - base >= 0 ? 'text-accent' : 'text-danger'}>
            {formatSignedEuro(scenario - base)}
          </span>
        </div>
      )}
    </>
  );
}
