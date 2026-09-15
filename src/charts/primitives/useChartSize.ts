'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** Larghezza reale del contenitore via ResizeObserver, per SVG che riempiono la colonna. */
export function useChartSize<T extends HTMLElement>(fallbackWidth = 600) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
