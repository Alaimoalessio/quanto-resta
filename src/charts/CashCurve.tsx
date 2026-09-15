'use client';

import { useCallback, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { area, line, curveMonotoneX } from 'd3-shape';
import { max, min } from 'd3-array';
import { useChartSize } from './primitives/useChartSize';
import { useAnimatedValues } from './primitives/useAnimatedPath';
import { usePointerIndex } from './primitives/usePointerIndex';
import { XAxis, YAxis } from './primitives/Axis';
import { Grid } from './primitives/Grid';
import { ChartTooltip } from './primitives/Tooltip';
import { HiddenTable } from './primitives/HiddenTable';
import { CashTooltipRows } from './CashTooltipRows';
import { formatEuro } from '@/lib/format';

export interface CashCurveProps {
  labels: string[]; // un'etichetta per punto
  base: number[]; // cassa a fine mese, proiezione base
  scenario: number[]; // cassa a fine mese, scenario
  criticalMonth: number | null; // indice del primo punto con cassa < 0 nello scenario
  description: string; // riassunto in una frase per aria-label
  height?: number;
  showBase?: boolean;
  names?: { base: string; scenario: string };
  extra?: { values: number[]; name: string } | null; // uno scenario salvato da sovrapporre
}

const M = { top: 20, right: 16, bottom: 28, left: 48 };

export function CashCurve({
  labels,
  base,
  scenario,
  criticalMonth,
  description,
  height = 320,
  showBase = true,
  names = { base: 'Base', scenario: 'Scenario' },
  extra = null,
}: CashCurveProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const n = labels.length;

  // Dominio calcolato sul target e animato insieme ai punti, così l'asse si adatta con la stessa transizione.
  const extraValues = extra && extra.values.length === n ? extra.values : null;
  const target = useMemo(() => {
    const all = [...(showBase ? base : []), ...scenario, ...(extraValues ?? [])];
    const lo = Math.min(0, min(all) ?? 0);
    const hi = Math.max(0, max(all) ?? 0);
    const pad = (hi - lo || 1) * 0.08;
    return [...base, ...scenario, ...(extraValues ?? base), lo - pad, hi + pad];
  }, [base, scenario, showBase, extraValues]);
  const v = useAnimatedValues(target);
  const aBase = v.slice(0, n);
  const aScenario = v.slice(n, 2 * n);
  const aExtra = v.slice(2 * n, 3 * n);
  const [yLo, yHi] = [v[3 * n], v[3 * n + 1]];

  const x = useCallback(
    (i: number) => M.left + (n > 1 ? (i * (width - M.left - M.right)) / (n - 1) : 0),
    [n, width],
  );
  const y = useMemo(
    () =>
      scaleLinear()
        .domain([yLo, yHi])
        .range([height - M.bottom, M.top]),
    [yLo, yHi, height],
  );

  const lineGen = line<number>()
    .x((_, i) => x(i))
    .y((d) => y(d))
    .curve(curveMonotoneX);
  const areaGen = area<number>()
    .x((_, i) => x(i))
    .y0(y(0))
    .y1((d) => y(d))
    .curve(curveMonotoneX);
  const hover = usePointerIndex(x, n);
  const every = width < 480 ? 2 : 1;
  const zeroY = y(0);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {(showBase || extraValues) && (
        <div
          className="absolute top-0 right-0 flex gap-3 text-[11px] text-secondary"
          aria-hidden="true"
        >
          {showBase && (
            <span className="border-t-2 border-dashed border-base pt-0.5">{names.base}</span>
          )}
          <span className="border-t-2 border-accent pt-0.5">{names.scenario}</span>
          {extraValues && (
            <span className="border-t-2 border-dotted border-secondary pt-0.5">{extra?.name}</span>
          )}
        </div>
      )}
      <svg
        role="img"
        aria-label={description}
        width={width}
        height={height}
        className="block overflow-visible"
        onPointerMove={hover.onPointerMove}
        onPointerLeave={hover.onPointerLeave}
      >
        <defs>
          <pattern
            id="hatch-danger"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="var(--danger)"
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
          </pattern>
          <clipPath id="below-zero">
            <rect
              x={M.left}
              y={zeroY}
              width={Math.max(0, width - M.left - M.right)}
              height={Math.max(0, height - M.bottom - zeroY)}
            />
          </clipPath>
        </defs>
        <Grid scale={y} x0={M.left} x1={width - M.right} />
        <YAxis scale={y} x={M.left - 8} />
        <XAxis scale={x} labels={labels} y={height - 8} every={every} />
        <path d={areaGen(aScenario) ?? ''} fill="url(#hatch-danger)" clipPath="url(#below-zero)" />
        {extraValues && (
          <path
            d={lineGen(aExtra) ?? ''}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={1.5}
            strokeDasharray="1.5 3"
            strokeLinecap="round"
          />
        )}
        {showBase && (
          <path
            d={lineGen(aBase) ?? ''}
            fill="none"
            stroke="var(--base)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
        <path
          d={lineGen(aScenario) ?? ''}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.25}
          strokeLinejoin="round"
        />
        {criticalMonth !== null && criticalMonth < n && (
          <g aria-hidden="true">
            <circle
              cx={x(criticalMonth)}
              cy={y(aScenario[criticalMonth])}
              r={4.5}
              fill="var(--danger)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
            <text
              x={x(criticalMonth)}
              y={y(aScenario[criticalMonth]) + 18}
              textAnchor={criticalMonth > n / 2 ? 'end' : 'start'}
              className="text-[11px] font-medium"
              fill="var(--danger)"
            >
              cassa sotto zero
            </text>
          </g>
        )}
        {hover.index !== null && (
          <g aria-hidden="true">
            <line
              x1={x(hover.index)}
              x2={x(hover.index)}
              y1={M.top}
              y2={height - M.bottom}
              stroke="var(--ink)"
              strokeOpacity={0.25}
            />
            {showBase && (
              <circle cx={x(hover.index)} cy={y(aBase[hover.index])} r={3} fill="var(--base)" />
            )}
            <circle
              cx={x(hover.index)}
              cy={y(aScenario[hover.index])}
              r={4}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
      {hover.index !== null && (
        <ChartTooltip x={x(hover.index)} y={y(aScenario[hover.index])} width={width}>
          <CashTooltipRows
            label={labels[hover.index]}
            base={showBase ? base[hover.index] : null}
            scenario={scenario[hover.index]}
            extra={
              extraValues ? { name: extra?.name ?? '', value: extraValues[hover.index] } : null
            }
            names={names}
          />
        </ChartTooltip>
      )}
      <HiddenTable
        caption="Cassa a fine mese"
        headers={['Mese', names.base, names.scenario]}
        rows={labels.map((l, i) => [l, formatEuro(base[i]), formatEuro(scenario[i])])}
      />
    </div>
  );
}
