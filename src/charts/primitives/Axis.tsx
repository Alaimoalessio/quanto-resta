import type { ScaleLinear } from 'd3-scale';
import { formatCompact } from '@/lib/format';

interface XAxisProps {
  scale: (i: number) => number;
  labels: string[];
  y: number;
  every?: number; // mostra un'etichetta ogni N mesi (per orizzonti lunghi o larghezze strette)
}

export function XAxis({ scale, labels, y, every = 1 }: XAxisProps) {
  return (
    <g className="text-[11px] text-secondary" aria-hidden="true">
      {labels.map((label, i) =>
        i % every === 0 ? (
          <text key={i} x={scale(i)} y={y} textAnchor="middle" fill="currentColor">
            {label}
          </text>
        ) : null,
      )}
    </g>
  );
}

interface YAxisProps {
  scale: ScaleLinear<number, number>;
  x: number;
  ticks?: number;
}

export function YAxis({ scale, x, ticks = 5 }: YAxisProps) {
  return (
    <g className="tnum text-[11px] text-secondary" aria-hidden="true">
      {scale.ticks(ticks).map((t) => (
        <text key={t} x={x} y={scale(t)} dy="0.32em" textAnchor="end" fill="currentColor">
          {formatCompact(t)}
        </text>
      ))}
    </g>
  );
}
