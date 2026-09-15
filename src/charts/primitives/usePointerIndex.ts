'use client';

import { useCallback, useState, type PointerEvent } from 'react';

/**
 * Indice del mese più vicino al puntatore, per i tooltip. Restituisce anche
 * gli handler da agganciare all'SVG.
 */
export function usePointerIndex(xOf: (i: number) => number, count: number) {
  const [index, setIndex] = useState<number | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < count; i++) {
        const d = Math.abs(xOf(i) - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setIndex(best);
    },
    [xOf, count],
  );

  const onPointerLeave = useCallback(() => setIndex(null), []);

  return { index, setIndex, onPointerMove, onPointerLeave };
}
