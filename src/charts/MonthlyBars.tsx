'use client';

import { useCallback, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { useChartSize } from './primitives/useChartSize';
import { useAnimatedValues } from './primitives/useAnimatedPath';
import { XAxis, YAxis } from './primitives/Axis';
import { Grid } from './primitives/Grid';
import { HiddenTable } from './primitives/HiddenTable';
import { formatEuro, formatSignedEuro } from '@/lib/format';

export type BarsMode = 'inout' | 'net';

export interface MonthlyBarsProps {
  labels: string[];
  inflows: number[]; // entrate del mese
  outflows: number[]; // uscite del mese (positive)
  baseNet?: number[]; // flusso netto della base, per il delta nel tooltip
  mode: BarsMode;
  selected: number | null;
  onSelect: (index: number | null) => void;
  description: string;
  height?: number;
}

const M = { top: 12, right: 8, bottom: 28, left: 48 };

export function MonthlyBars({
  labels,
  inflows,
  outflows,
  baseNet,
  mode,
  selected,
  onSelect,
  description,
  height = 220,
}: MonthlyBarsProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const n = labels.length;
  const net = useMemo(() => inflows.map((v, i) => v - outflows[i]), [inflows, outflows]);

  const target = useMemo(() => {
    const hi =
      mode === 'inout' ? (max([...inflows, ...outflows]) ?? 0) : Math.max(0, max(net) ?? 0);
    const lo = mode === 'inout' ? 0 : Math.min(0, ...net);
    return [...inflows, ...outflows, ...net, lo, hi];
  }, [inflows, outflows, net, mode]);
  const v = useAnimatedValues(target);
  const aIn = v.slice(0, n);
  const aOut = v.slice(n, 2 * n);
  const aNet = v.slice(2 * n, 3 * n);
  const [lo, hi] = [v[3 * n], v[3 * n + 1]];

  const slot = n > 0 ? (width - M.left - M.right) / n : 0;
  const x = useCallback((i: number) => M.left + slot * (i + 0.5), [slot]);
  const y = useMemo(
    () =>
      scaleLinear()
        .domain([lo, hi])
        .nice()
        .range([height - M.bottom, M.top]),
    [lo, hi, height],
  );
  const barW = Math.max(2, Math.min(14, slot * 0.28));
  const every = width < 480 ? 2 : 1;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg
        role="img"
        aria-label={description}
        width={width}
        height={height}
        className="block overflow-visible"
      >
        <Grid scale={y} x0={M.left} x1={width - M.right} ticks={4} />
        <YAxis scale={y} x={M.left - 8} ticks={4} />
        <XAxis scale={x} labels={labels} y={height - 8} every={every} />
        {labels.map((label, i) => {
          const isSel = selected === i;
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`${label}: entrate ${formatEuro(inflows[i])}, uscite ${formatEuro(outflows[i])}, netto ${formatSignedEuro(net[i])}`}
              aria-pressed={isSel}
              className="cursor-pointer outline-none"
              onClick={() => onSelect(isSel ? null : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(isSel ? null : i);
                }
              }}
            >
              <rect
                x={M.left + slot * i}
                y={M.top}
                width={slot}
                height={height - M.top - M.bottom}
                fill={isSel ? 'var(--ink)' : 'transparent'}
                fillOpacity={0.06}
              />
              {mode === 'inout' ? (
                <>
                  <rect
                    x={x(i) - barW - 1}
                    y={y(aIn[i])}
                    width={barW}
                    height={Math.max(0, y(0) - y(aIn[i]))}
                    fill="var(--accent)"
                  />
                  <rect
                    x={x(i) + 1}
                    y={y(aOut[i])}
                    width={barW}
                    height={Math.max(0, y(0) - y(aOut[i]))}
                    fill="var(--base)"
                  />
                </>
              ) : (
                <rect
                  x={x(i) - barW / 2}
                  y={Math.min(y(0), y(aNet[i]))}
                  width={barW}
                  height={Math.abs(y(0) - y(aNet[i]))}
                  fill={net[i] >= 0 ? 'var(--accent)' : 'var(--danger)'}
                />
              )}
            </g>
          );
        })}
      </svg>
      {selected !== null && (
        <div className="tnum absolute top-0 right-0 rounded border border-border bg-surface px-3 py-2 text-xs">
          <div className="mb-1 font-medium capitalize">{labels[selected]}</div>
          <div className="flex justify-between gap-4">
            <span className="text-secondary">Entrate</span>
            <span>{formatEuro(inflows[selected])}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-secondary">Uscite</span>
            <span>{formatEuro(outflows[selected])}</span>
          </div>
          <div className="mt-1 flex justify-between gap-4 border-t border-border pt-1">
            <span>Netto</span>
            <span className={net[selected] >= 0 ? 'text-accent' : 'text-danger'}>
              {formatSignedEuro(net[selected])}
            </span>
          </div>
          {baseNet && (
            <div className="flex justify-between gap-4 text-secondary">
              <span>vs base</span>
              <span>{formatSignedEuro(net[selected] - baseNet[selected])}</span>
            </div>
          )}
        </div>
      )}
      <HiddenTable
        caption="Entrate e uscite per mese"
        headers={['Mese', 'Entrate', 'Uscite', 'Netto']}
        rows={labels.map((l, i) => [
          l,
          formatEuro(inflows[i]),
          formatEuro(outflows[i]),
          formatSignedEuro(net[i]),
        ])}
      />
    </div>
  );
}
