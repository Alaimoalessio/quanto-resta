import { Document, Image as PdfImage, Page, Text, View } from '@react-pdf/renderer';
import { C, Footer, KpiTable, MONTH_COLS, Rich, TONE_COLOR, s } from './reportParts';
import type { Assumptions, Lever, Projection, Scenario } from '@/domain/types';
import type { Verdict } from '@/domain/verdict';
import { describeLever } from '@/domain/describe';
import { templates } from '@/config/templates';
import { brand } from '@/config/brand';
import { formatEuro, formatPct, monthLong, monthShort } from '@/lib/format';

export interface ReportData {
  scenario: Scenario;
  base: Projection;
  projection: Projection;
  verdict: Verdict;
  image: string | null; // data URL PNG della curva
  generatedAt: string;
}

function assumptionRows(a: Assumptions): [string, string][] {
  return [
    ['Cassa iniziale', formatEuro(a.cashStart)],
    ['Ricavi medi mensili', formatEuro(a.revenueMonthly)],
    ['Materie prime e merce', formatPct(a.cogsPct, 0)],
    ['Personale', `${a.staff.count} × ${formatEuro(a.staff.costEachMonthly)}`],
    ['Affitto', formatEuro(a.rentMonthly)],
    ['Utenze', formatEuro(a.utilitiesMonthly)],
    ['Marketing', formatEuro(a.marketingMonthly)],
    ['Altre spese fisse', formatEuro(a.otherFixedMonthly)],
    ['Prelievo del titolare', formatEuro(a.ownerDrawMonthly)],
    ['Aliquota', formatPct(a.taxPct, 0)],
    ['Orizzonte', `${a.horizonMonths} mesi da ${monthLong(a.startMonth)} ${a.startYear}`],
  ];
}

export function ReportDocument({
  scenario,
  base,
  projection,
  verdict,
  image,
  generatedAt,
}: ReportData) {
  const a = scenario.assumptions;
  const levers: Lever[] = scenario.levers;
  const title = scenario.name || 'Scenario senza nome';
  return (
    <Document title={`${brand.name} — ${title}`} author={brand.name} language="it">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{brand.name}</Text>
          <Text style={s.meta}>Simulazione «cosa succede se» · {generatedAt}</Text>
        </View>
        <Text style={s.h1}>{title}</Text>
        <Text style={s.meta}>
          {templates[a.businessType].label} · {a.horizonMonths} mesi da {monthLong(a.startMonth)}{' '}
          {a.startYear}
        </Text>

        <Text style={s.h2}>Verdetto</Text>
        <View style={[s.verdict, { borderLeftColor: TONE_COLOR[verdict.tone] }]}>
          <Rich text={verdict.sentences.join(' ')} />
        </View>

        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.h2}>Ipotesi di partenza</Text>
            {assumptionRows(a).map(([k, v]) => (
              <View key={k} style={s.row}>
                <Text style={s.cell}>{k}</Text>
                <Text style={[s.cell, s.num]}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Leve attive</Text>
            {levers.length === 0 ? (
              <Text style={{ color: C.secondary }}>
                Nessuna leva: la proiezione coincide con la base.
              </Text>
            ) : (
              levers.map((l, i) => (
                <View key={i} style={s.row}>
                  <Text>• {describeLever(l, a)}</Text>
                </View>
              ))
            )}
            <Text style={s.h2}>Indicatori, base e scenario</Text>
            <KpiTable base={base} projection={projection} />
          </View>
        </View>

        {image && (
          <View>
            <Text style={s.h2}>Cassa a fine mese</Text>
            <PdfImage src={image} style={s.image} />
          </View>
        )}
        <Footer generatedAt={generatedAt} />
      </Page>

      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{brand.name}</Text>
          <Text style={s.meta}>{title} · tabella mensile dello scenario</Text>
        </View>
        <View style={s.tableHead}>
          <Text style={[s.th, { textAlign: 'left' }]}>Mese</Text>
          {MONTH_COLS.map((c) => (
            <Text key={c.key} style={s.th}>
              {c.label}
            </Text>
          ))}
        </View>
        {projection.months.map((m) => (
          <View key={m.index} style={s.row}>
            <Text style={[s.td, { textAlign: 'left' }]}>
              {monthShort(m.month)} {m.year}
            </Text>
            {MONTH_COLS.map((c) => (
              <Text
                key={c.key}
                style={[s.td, c.key === 'cashEnd' && m.cashEnd < 0 ? { color: C.danger } : {}]}
              >
                {formatEuro((m[c.key] as number) + (c.key === 'oneOffs' ? m.investment : 0))}
              </Text>
            ))}
          </View>
        ))}
        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
