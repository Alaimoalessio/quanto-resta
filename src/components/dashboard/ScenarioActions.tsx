'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toScenario, useScenarioStore, type SavedScenario } from '@/store/scenario';
import { encodeScenario } from '@/domain/share';
import { project } from '@/domain/engine';
import { persistence } from '@/lib/persistence';
import { shareUrl } from '@/lib/useUrlSync';
import { downloadBlob, monthsToCsv, svgToPng } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { SavedMenu } from './SavedMenu';

const fileName = (name: string): string =>
  (name || 'scenario')
    .normalize('NFD')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'scenario';

/** Nome dello scenario e azioni: Salva, Condividi, PDF, CSV. */
export function ScenarioActions({ extra }: { extra?: React.ReactNode }) {
  const { name, assumptions, levers, saved, setName, setSaved } = useScenarioStore(
    useShallow((s) => ({
      name: s.name,
      assumptions: s.assumptions,
      levers: s.levers,
      saved: s.saved,
      setName: s.setName,
      setSaved: s.setSaved,
    })),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const save = (): void => {
    const scenario = toScenario({ name, assumptions, levers });
    const k = project(scenario.assumptions, scenario.levers).kpis;
    const entry: SavedScenario = {
      id: `s${Date.now().toString(36)}`,
      name: name || `Scenario ${saved.length + 1}`,
      savedAt: new Date().toISOString(),
      scenario,
      kpis: { cashEnd: k.cashEnd, cashMin: k.cashMin, breakEvenMonth: k.breakEvenMonth },
    };
    if (!name) setName(entry.name);
    const next = [entry, ...saved].slice(0, 20);
    setSaved(next);
    persistence.writeSaved(next);
    setToast('Scenario salvato');
  };

  const share = async (): Promise<void> => {
    const url = shareUrl(encodeScenario(toScenario({ name, assumptions, levers })));
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copiato');
    } catch {
      window.prompt('Copia il link', url);
    }
  };

  const exportCsv = (): void => {
    const scenario = toScenario({ name, assumptions, levers });
    const csv = monthsToCsv(project(scenario.assumptions, scenario.levers).months);
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `quanto-resta-${fileName(name)}.csv`,
    );
  };

  const exportPdf = async (): Promise<void> => {
    setBusy(true);
    try {
      const svg = document.querySelector<SVGSVGElement>('[data-chart="cash"] svg');
      const image = svg ? await svgToPng(svg).catch(() => null) : null;
      const s = encodeScenario(toScenario({ name, assumptions, levers }));
      const res = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s, image }),
      });
      if (!res.ok) throw new Error(await res.text());
      downloadBlob(await res.blob(), `quanto-resta-${fileName(name)}.pdf`);
      setToast('PDF pronto');
    } catch {
      setToast('PDF non generato: riprova');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome scenario"
        aria-label="Nome dello scenario"
        maxLength={40}
        className="hidden h-8 w-36 rounded border border-transparent bg-transparent px-2 text-sm hover:border-border focus:border-accent focus:outline-none md:block"
      />
      <SavedMenu />
      <Button size="sm" onClick={save}>
        Salva
      </Button>
      <Button size="sm" onClick={share}>
        Condividi
      </Button>
      <Button size="sm" onClick={exportPdf} disabled={busy} aria-busy={busy}>
        {busy ? 'Preparo…' : 'PDF'}
      </Button>
      <Button size="sm" variant="ghost" onClick={exportCsv} className="hidden md:inline-flex">
        CSV
      </Button>
      {extra}
      {toast && (
        <span
          role="status"
          className="absolute top-full right-4 mt-2 rounded bg-ink px-3 py-1.5 text-xs text-paper shadow"
        >
          {toast}
        </span>
      )}
    </div>
  );
}
