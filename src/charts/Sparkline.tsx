'use client';

import { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import { extent } from 'd3-array';
import { useAnimatedValues } from './primitives/useAnimatedPath';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  zeroLine?: boolean;
}

/** Mini-grafico senza assi per le tessere KPI. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  color = 'var(--accent)',
  zeroLine = false,
}: SparklineProps) {
  const v = useAnimatedValues(values);
  const [lo, hi] = extent(v) as [number, number];
  const y = useMemo(() => {
    const min = Math.min(zeroLine ? 0 : lo, lo);
    const max = Math.max(zeroLine ? 0 : hi, hi);
    return scaleLinear()
      .domain([min, max === min ? min + 1 : max])
      .range([height - 2, 2]);
  }, [lo, hi, height, zeroLine]);
  const x = (i: number) => (v.length > 1 ? (i * (width - 2)) / (v.length - 1) + 1 : width / 2);
  const d =
    line<number>()
      .x((_, i) => x(i))
      .y((p) => y(p))
      .curve(curveMonotoneX)(v) ?? '';

  return (
    <svg width={width} height={height} aria-hidden="true" className="block overflow-visible">
      {zeroLine && <line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke="var(--border)" />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={x(v.length - 1)} cy={y(v[v.length - 1] ?? 0)} r={2} fill={color} />
    </svg>
  );
}
