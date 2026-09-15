import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Projection } from '@/domain/types';
import { brand } from '@/config/brand';
import { formatEuro, formatPct, monthShort } from '@/lib/format';

export const C = brand.colors;

export const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.ink,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 8,
    marginBottom: 14,
  },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  meta: { color: C.secondary, fontSize: 8 },
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 16, marginBottom: 2 },
  h2: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 5,
  },
  verdict: { fontSize: 11, lineHeight: 1.4, borderLeftWidth: 3, paddingLeft: 8, marginTop: 4 },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 3,
  },
  cell: { flex: 1 },
  num: { textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  cols: { flexDirection: 'row', gap: 20 },
  col: { flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: C.secondary,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 5,
  },
  image: { width: '100%', marginTop: 6 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    paddingBottom: 3,
    marginBottom: 2,
  },
  th: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 7, textAlign: 'right' },
  td: { flex: 1, fontSize: 7.5, textAlign: 'right' },
});

export const TONE_COLOR = { green: C.accent, amber: C.warning, red: C.danger } as const;

/** "**testo**" → grassetto. */
export function Rich({ text }: { text: string }) {
  return (
    <Text>
      {text.split('**').map((part, i) => (
        <Text key={i} style={i % 2 === 1 ? s.bold : undefined}>
          {part}
        </Text>
      ))}
    </Text>
  );
}

function monthOf(p: Projection, i: number | null): string {
  if (i === null) return 'mai';
  const m = p.months[i];
  return `${monthShort(m.month)} ${m.year}`;
}

export function KpiTable({ base, projection }: { base: Projection; projection: Projection }) {
  const rows: [string, string, string][] = [
    ['Cassa a fine periodo', formatEuro(base.kpis.cashEnd), formatEuro(projection.kpis.cashEnd)],
    ['Punto più basso', formatEuro(base.kpis.cashMin), formatEuro(projection.kpis.cashMin)],
    [
      'Cassa sotto zero',
      monthOf(base, base.kpis.criticalMonth),
      monthOf(projection, projection.kpis.criticalMonth),
    ],
    [
      'Pareggio',
      monthOf(base, base.kpis.breakEvenMonth),
      monthOf(projection, projection.kpis.breakEvenMonth),
    ],
    ['Margine operativo', formatPct(base.kpis.marginPct), formatPct(projection.kpis.marginPct)],
    ['Ricavi totali', formatEuro(base.kpis.totalRevenue), formatEuro(projection.kpis.totalRevenue)],
    [
      'Utile operativo totale',
      formatEuro(base.kpis.totalProfit),
      formatEuro(projection.kpis.totalProfit),
    ],
  ];
  return (
    <View>
      <View style={s.row}>
        <Text style={[s.cell, s.bold]}>Indicatore</Text>
        <Text style={[s.cell, s.num, s.bold]}>Base</Text>
        <Text style={[s.cell, s.num, s.bold]}>Scenario</Text>
      </View>
      {rows.map(([k, b, v]) => (
        <View key={k} style={s.row}>
          <Text style={s.cell}>{k}</Text>
          <Text style={[s.cell, s.num, { color: C.secondary }]}>{b}</Text>
          <Text style={[s.cell, s.num]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export const MONTH_COLS: { key: keyof Projection['months'][number]; label: string }[] = [
  { key: 'revenue', label: 'Ricavi' },
  { key: 'cogs', label: 'Merce' },
  { key: 'staff', label: 'Personale' },
  { key: 'fixed', label: 'Fissi' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'operatingProfit', label: 'Utile op.' },
  { key: 'taxes', label: 'Tasse' },
  { key: 'loanPayment', label: 'Rate' },
  { key: 'ownerDraw', label: 'Prelievo' },
  { key: 'oneOffs', label: 'Una tantum' },
  { key: 'netCashFlow', label: 'Flusso' },
  { key: 'cashEnd', label: 'Cassa' },
];

export function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <Text style={s.footer} fixed>
      {brand.disclaimer} — {brand.name}, {generatedAt}
    </Text>
  );
}
