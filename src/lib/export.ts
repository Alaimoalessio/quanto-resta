import type { MonthResult } from '@/domain/types';
import { monthShort } from './format';

/**
 * Serializza un SVG in PNG via canvas. Le classi Tailwind e le variabili CSS
 * non sopravvivono alla serializzazione, quindi copio gli stili calcolati
 * (fill, stroke, font) come attributi sul clone.
 */
export async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const width = svg.clientWidth || Number(svg.getAttribute('width')) || 800;
  const height = svg.clientHeight || Number(svg.getAttribute('height')) || 300;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const src = svg.querySelectorAll<SVGElement>('*');
  const dst = clone.querySelectorAll<SVGElement>('*');
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = dst[i];
    if (!target) return;
    for (const prop of [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-dasharray',
      'stroke-opacity',
      'fill-opacity',
      'font-size',
      'font-family',
      'font-weight',
    ] as const) {
      const v = cs.getPropertyValue(prop);
      if (v) target.setAttribute(prop, v);
    }
    target.removeAttribute('class');
  });

  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVG non renderizzabile'));
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const CSV_COLS: { key: keyof MonthResult; label: string }[] = [
  { key: 'revenue', label: 'Ricavi' },
  { key: 'cogs', label: 'Materie prime e merce' },
  { key: 'staff', label: 'Personale' },
  { key: 'fixed', label: 'Spese fisse' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'operatingProfit', label: 'Utile operativo' },
  { key: 'taxes', label: 'Tasse' },
  { key: 'loanPayment', label: 'Rate' },
  { key: 'ownerDraw', label: 'Prelievo' },
  { key: 'investment', label: 'Investimenti' },
  { key: 'oneOffs', label: 'Una tantum' },
  { key: 'netCashFlow', label: 'Flusso di cassa' },
  { key: 'cashEnd', label: 'Cassa a fine mese' },
];

/** CSV "all'italiana": punto e virgola come separatore, virgola decimale, BOM per Excel. */
export function monthsToCsv(months: MonthResult[]): string {
  const num = (v: number): string => v.toFixed(2).replace('.', ',');
  const head = ['Mese', ...CSV_COLS.map((c) => c.label)].join(';');
  const rows = months.map((m) =>
    [`${monthShort(m.month)} ${m.year}`, ...CSV_COLS.map((c) => num(m[c.key] as number))].join(';'),
  );
  return `﻿${[head, ...rows].join('\r\n')}\r\n`;
}
