'use client';

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore, type SavedScenario } from '@/store/scenario';
import { persistence } from '@/lib/persistence';
import { Button } from '@/components/ui/Button';
import { formatEuro } from '@/lib/format';

const dateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

/** Elenco degli scenari salvati: apri, confronta, elimina. */
export function SavedMenu() {
  const { saved, compareWith, setSaved, setCompareWith, loadScenario } = useScenarioStore(
    useShallow((s) => ({
      saved: s.saved,
      compareWith: s.compareWith,
      setSaved: s.setSaved,
      setCompareWith: s.setCompareWith,
      loadScenario: s.loadScenario,
    })),
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const remove = (s: SavedScenario): void => {
    const next = saved.filter((x) => x.id !== s.id);
    setSaved(next);
    persistence.writeSaved(next);
    if (compareWith?.id === s.id) setCompareWith(null);
  };

  if (saved.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Salvati
        <span className="tnum rounded-full bg-border px-1.5 text-[10px]">{saved.length}</span>
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-80 rounded border border-border bg-surface p-1 shadow-md"
        >
          {saved.map((s) => {
            const comparing = compareWith?.id === s.id;
            return (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.name || 'Senza nome'}</div>
                  <div className="tnum text-xs text-secondary">
                    {dateFmt.format(new Date(s.savedAt))} · cassa finale{' '}
                    {formatEuro(s.kpis.cashEnd)}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="text-xs text-secondary hover:text-ink"
                  onClick={() => {
                    loadScenario(s.scenario);
                    setOpen(false);
                  }}
                >
                  Apri
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={comparing}
                  className={`text-xs hover:text-ink ${comparing ? 'text-accent' : 'text-secondary'}`}
                  onClick={() => setCompareWith(comparing ? null : s)}
                >
                  {comparing ? 'In confronto' : 'Confronta'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="text-xs text-secondary hover:text-danger"
                  onClick={() => remove(s)}
                  aria-label={`Elimina ${s.name}`}
                >
                  Elimina
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
