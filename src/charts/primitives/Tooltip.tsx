'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface TooltipProps {
  x: number; // posizione del punto nel contenitore, in px
  y: number;
  width: number; // larghezza del contenitore, per il clamp
  children: ReactNode;
}

/** Tooltip HTML sopra l'SVG, agganciato a un punto, con clamp ai bordi del contenitore. */
export function ChartTooltip({ x, y, width, children }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [children]);

  const gap = 12;
  let left = x + gap;
  if (left + size.w > width) left = x - gap - size.w;
  left = Math.max(0, left);
  const top = Math.max(0, y - size.h - gap);

  return (
    <div
      ref={ref}
      role="status"
      className="tnum pointer-events-none absolute z-10 rounded border border-border bg-surface px-3 py-2 text-xs shadow-sm"
      style={{ left, top }}
    >
      {children}
    </div>
  );
}
