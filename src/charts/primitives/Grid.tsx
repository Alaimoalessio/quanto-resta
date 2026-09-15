import type { ScaleLinear } from 'd3-scale';

interface GridProps {
  scale: ScaleLinear<number, number>;
  x0: number;
  x1: number;
  ticks?: number;
}

/** Linee orizzontali sottili; la linea dello zero è leggermente più marcata. */
export function Grid({ scale, x0, x1, ticks = 5 }: GridProps) {
  return (
    <g aria-hidden="true">
      {scale.ticks(ticks).map((t) => (
        <line
          key={t}
          x1={x0}
          x2={x1}
          y1={scale(t)}
          y2={scale(t)}
          stroke={t === 0 ? 'var(--ink)' : 'var(--border)'}
          strokeOpacity={t === 0 ? 0.5 : 1}
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      ))}
    </g>
  );
}
