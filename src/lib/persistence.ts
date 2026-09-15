import type { SavedScenario } from '@/store/scenario';

const KEYS = {
  onboarded: 'bussola:onboarded',
  current: 'bussola:current',
  saved: 'bussola:saved',
} as const;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // storage pieno o disabilitato: lo stato resta nell'URL
  }
}

export const persistence = {
  readOnboarded: (): boolean => read(KEYS.onboarded) === '1',
  writeOnboarded: (v: boolean): void => write(KEYS.onboarded, v ? '1' : null),
  readCurrent: (): string | null => read(KEYS.current),
  writeCurrent: (encoded: string): void => write(KEYS.current, encoded),
  readSaved: (): SavedScenario[] => {
    const raw = read(KEYS.saved);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedScenario[]) : [];
    } catch {
      return [];
    }
  },
  writeSaved: (saved: SavedScenario[]): void => write(KEYS.saved, JSON.stringify(saved)),
};
