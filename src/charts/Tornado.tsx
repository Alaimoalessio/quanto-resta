'use client';

import { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { useChartSize } from './primitives/useChartSize';
import { useAnimatedValues } from './primitives/useAnimatedPath';
import { HiddenTable } from './primitives/HiddenTable';
import { formatSignedEuro } from '@/lib/format';

export interface TornadoItem {
  label: string;
  value: number; // impatto sulla cassa finale
}

export interface TornadoProps {
  items: TornadoItem[]; // già ordinati per impatto assoluto
  description: string;
}

const ROW = 30;
const LABEL_W = 150;
const VALUE_W = 72;

/** Barre orizzontali ordinate per impatto assoluto, colorate per segno. */
export function Tornado({ items, description }: TornadoProps) {
  const { ref, width } = useChartSize<HTMLDivElement>();
  const target = useMemo(() => items.map((i) => i.value), [items]);
  const v = useAnimatedValues(target);
  const height = items.length * ROW + 8;
  const extent = max(items, (i) => Math.abs(i.value)) ?? 1;
  const plotW = Math.max(40, width - LABEL_W - VALUE_W);
  const x = scaleLinear()
    .domain([-extent, extent])
    .range([LABEL_W, LABEL_W + plotW]);
  const mid = x(0);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg
        role="img"
        aria-label={description}
        width={width}
        height={height}
        className="block overflow-visible"
      >
        <line x1={mid} x2={mid} y1={0} y2={height} stroke="var(--border)" />
        {items.map((item, i) => {
          const val = v[i] ?? 0;
          const cy = 4 + i * ROW + ROW / 2;
          const x0 = Math.min(mid, x(val));
          const w = Math.abs(x(val) - mid);
          const positive = item.value >= 0;
          return (
            <g key={item.label + i}>
              <text
                x={LABEL_W - 12}
                y={cy}
                dy="0.32em"
                textAnchor="end"
                className="text-xs"
                fill="var(--ink)"
              >
                {item.label}
              </text>
              <rect
                x={x0}
                y={cy - 9}
                width={w}
                height={18}
                fill={positive ? 'var(--accent)' : 'var(--danger)'}
              />
              <text
                x={LABEL_W + plotW + 10}
                y={cy}
                dy="0.32em"
                textAnchor="start"
                className="tnum text-xs font-medium"
                fill={positive ? 'var(--accent)' : 'var(--danger)'}
              >
                {formatSignedEuro(item.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <HiddenTable
        caption="Peso di ogni leva sulla cassa finale"
        headers={['Leva', 'Impatto']}
        rows={items.map((i) => [i.label, formatSignedEuro(i.value)])}
      />
    </div>
  );
}
