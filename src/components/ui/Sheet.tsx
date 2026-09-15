'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';

interface SheetProps {
  title: string;
  collapsedHeight?: number;
  children: ReactNode;
}

/**
 * Bottom sheet trascinabile (mobile): tre posizioni — chiuso, metà, quasi tutto
 * schermo. Il cruscotto resta visibile mentre si muovono gli slider.
 */
export function Sheet({ title, collapsedHeight = 60, children }: SheetProps) {
  const [vh, setVh] = useState(800);
  const snaps = useMemo(
    () => [collapsedHeight, Math.round(vh * 0.5), Math.round(vh * 0.9)],
    [collapsedHeight, vh],
  );
  const [height, setHeight] = useState(collapsedHeight);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const update = (): void => setVh(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const snapTo = useCallback(
    (h: number) => {
      const nearest = snaps.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
      setHeight(nearest);
    },
    [snaps],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    drag.current = { startY: e.clientY, startH: height };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return;
    const h = drag.current.startH + (drag.current.startY - e.clientY);
    setHeight(Math.max(collapsedHeight, Math.min(snaps[2], h)));
  };
  const onPointerUp = (): void => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    snapTo(height);
  };

  const expanded = height > collapsedHeight + 10;
  const toggle = (): void => setHeight(expanded ? snaps[0] : snaps[1]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-xl border-t border-border bg-paper shadow-[0_-8px_24px_rgba(20,26,34,0.08)]"
      style={{
        height,
        transition: dragging ? 'none' : 'height 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      role="region"
      aria-label={title}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-2 px-4 pt-2 pb-3 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          <span className="font-display text-lg">{title}</span>
          <span className="text-xs text-secondary">{expanded ? 'Chiudi' : 'Apri'}</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}
