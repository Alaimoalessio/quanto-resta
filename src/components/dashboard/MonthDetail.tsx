'use client';

import type { MonthResult } from '@/domain/types';
import { formatEuro, formatSignedEuro } from '@/lib/format';

interface MonthDetailProps {
  label: string;
  base: MonthResult;
  scenario: MonthResult;
  compare: boolean;
  onClose: () => void;
}

const ROWS: { key: keyof MonthResult; label: string; sign: 1 | -1 }[] = [
  { key: 'revenue', label: 'Ricavi', sign: 1 },
  { key: 'cogs', label: 'Materie prime e merce', sign: -1 },
  { key: 'staff', label: 'Personale', sign: -1 },
  { key: 'fixed', label: 'Affitto, utenze e fissi', sign: -1 },
  { key: 'marketing', label: 'Marketing', sign: -1 },
  { key: 'operatingProfit', label: 'Utile operativo', sign: 1 },
  { key: 'taxes', label: 'Tasse', sign: -1 },
  { key: 'loanPayment', label: 'Rate', sign: -1 },
  { key: 'ownerDraw', label: 'Prelievo del titolare', sign: -1 },
  { key: 'investment', label: 'Investimenti', sign: -1 },
  { key: 'oneOffs', label: 'Una tantum', sign: -1 },
  { key: 'netCashFlow', label: 'Flusso di cassa', sign: 1 },
  { key: 'cashEnd', label: 'Cassa a fine mese', sign: 1 },
];

/** Dettaglio delle voci di un mese, base e scenario a confronto. */
export function MonthDetail({ label, base, scenario, compare, onClose }: MonthDetailProps) {
  return (
    <div className="mt-3 rounded border border-border bg-paper/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium capitalize">{label}</h4>
        <button type="button" onClick={onClose} className="text-xs text-secondary hover:text-ink">
          Chiudi
        </button>
      </div>
      <table className="tnum w-full text-xs">
        <thead className="text-secondary">
          <tr>
            <th scope="col" className="py-1 text-left font-normal">
              Voce
            </th>
            {compare && (
              <th scope="col" className="py-1 text-right font-normal">
                Base
              </th>
            )}
            <th scope="col" className="py-1 text-right font-normal">
              {compare ? 'Scenario' : 'Importo'}
            </th>
            {compare && (
              <th scope="col" className="py-1 text-right font-normal">
                Diff.
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => {
            const b = base[r.key] as number;
            const s = scenario[r.key] as number;
            if (!compare && s === 0 && r.key !== 'cashEnd') return null;
            if (compare && s === 0 && b === 0 && r.key !== 'cashEnd') return null;
            const strong =
              r.key === 'operatingProfit' || r.key === 'netCashFlow' || r.key === 'cashEnd';
            const diff = (s - b) * r.sign;
            return (
              <tr key={r.key} className={`border-t border-border ${strong ? 'font-medium' : ''}`}>
                <th scope="row" className="py-1 text-left font-inherit">
                  {r.label}
                </th>
                {compare && <td className="py-1 text-right text-secondary">{formatEuro(b)}</td>}
                <td
                  className={`py-1 text-right ${r.key === 'cashEnd' && s < 0 ? 'text-danger' : ''}`}
                >
                  {formatEuro(s)}
                </td>
                {compare && (
                  <td
                    className={`py-1 text-right ${diff > 0.5 ? 'text-accent' : diff < -0.5 ? 'text-danger' : 'text-secondary'}`}
                  >
                    {Math.abs(s - b) < 0.5 ? '–' : formatSignedEuro(s - b)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
