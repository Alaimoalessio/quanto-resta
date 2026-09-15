'use client';

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toScenario, useScenarioStore } from '@/store/scenario';
import { encodeScenario } from '@/domain/share';
import { persistence } from './persistence';

export const SHARE_PARAM = 's';

export function shareUrl(encoded: string): string {
  const url = new URL(window.location.href);
  url.search = `?${SHARE_PARAM}=${encoded}`;
  url.hash = '';
  return url.toString();
}

/** Tiene l'URL (`?s=`) e il localStorage allineati allo scenario, con debounce di 300 ms. */
export function useUrlSync(): void {
  const { hydrated, onboarded, name, assumptions, levers } = useScenarioStore(
    useShallow((s) => ({
      hydrated: s.hydrated,
      onboarded: s.onboarded,
      name: s.name,
      assumptions: s.assumptions,
      levers: s.levers,
    })),
  );
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    const t = window.setTimeout(() => {
      const encoded = encodeScenario(toScenario({ name, assumptions, levers }));
      window.history.replaceState(window.history.state, '', shareUrl(encoded));
      persistence.writeCurrent(encoded);
    }, 300);
    return () => window.clearTimeout(t);
  }, [hydrated, onboarded, name, assumptions, levers]);
}
