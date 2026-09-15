'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Interpola un array di numeri verso il nuovo target con requestAnimationFrame.
 * Se il target cambia a metà animazione si riparte dai valori correnti, così
 * durante il trascinamento di uno slider la curva insegue senza scatti.
 * Con `prefers-reduced-motion` salta direttamente al target.
 */
export function useAnimatedValues(target: number[], duration = 450): number[] {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(target);
  const current = useRef(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = current.current;
    const sameLength = from.length === target.length;
    const unchanged = sameLength && from.every((v, i) => v === target[i]);
    if (unchanged) return;
    if (reduced || !sameLength || duration <= 0) {
      current.current = target;
      setValues(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      const next = from.map((v, i) => v + (target[i] - v) * e);
      current.current = next;
      setValues(next);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, reduced]);

  // Se la lunghezza è appena cambiata (12 → 24 mesi) lo stato è ancora vecchio per un render: mostro il target.
  return values.length === target.length ? values : target;
}
