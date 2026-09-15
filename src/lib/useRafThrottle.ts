'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Esegue `fn` al massimo una volta per frame, con l'ultimo argomento ricevuto.
 * Throttle con requestAnimationFrame e non debounce: chi trascina uno slider
 * deve vedere il grafico muoversi insieme al dito, non dopo che si è fermato.
 */
export function useRafThrottle<T>(fn: (value: T) => void): (value: T) => void {
  const latest = useRef<{ value: T } | null>(null);
  const frame = useRef<number | null>(null);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return useCallback((value: T) => {
    latest.current = { value };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (latest.current) fnRef.current(latest.current.value);
      latest.current = null;
    });
  }, []);
}
