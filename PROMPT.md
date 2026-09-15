# "Cosa succede se" — simulatore di scenari per piccole imprese — specifica di progetto

Sei un senior full-stack engineer con forte sensibilità di prodotto, design e dati. Devi costruire da zero, in questo repository vuoto, **un simulatore "cosa succede se" per titolari di piccole attività**: l'utente descrive la sua attività con pochi numeri, muove delle leve (alzo i prezzi, assumo una persona, apro anche la domenica, compro un macchinario…) e vede in tempo reale cosa succede alla cassa, al margine e al punto di pareggio nei prossimi 12 mesi. È un progetto da portfolio: deve essere visivamente eccellente, tecnicamente solido, e sembrare un prodotto che un commercialista consiglierebbe a un cliente.

Lavora **per fasi** (sezione 13). Alla fine di ogni fase: build pulita, lint pulito, test verdi, e un breve riepilogo di cosa hai fatto e cosa manca. Non passare alla fase successiva se la precedente non compila.

---

## 1. Obiettivo e utente

L'utente è il **titolare di una piccola attività** (bar, ristorante, negozio, artigiano, studio professionale, e-commerce) che fa questi conti a mente la notte e non ha mai avuto uno strumento per farli bene. Non è un tecnico e non è un finanziere: parla di "incasso", "spese", "quanto mi resta", non di EBITDA.

In 60 secondi deve poter: scegliere il tipo di attività → confermare o correggere i numeri di partenza (precompilati) → muovere una o più leve → capire, con un grafico e due frasi in italiano, se la scelta lo porta in salvo o nei guai, e quando. Poi salvare o condividere lo scenario con un link e scaricare un riepilogo in PDF.

Il prodotto demo si chiama **"Bussola"**. Il branding deve essere sostituibile cambiando un solo file.

## 2. Stack (vincolante)

- **Next.js 15+** (App Router) + **TypeScript strict**
- **Tailwind CSS v4**, **niente** librerie di componenti UI: i componenti li scrivi tu
- **Grafici in SVG scritti a mano** con `d3-scale`, `d3-shape` e `d3-array` per scale e curve (**non** Recharts, Chart.js, Nivo o simili): servono transizioni morbide tra scenari, tooltip disegnati su misura e un'estetica editoriale che le librerie non danno
- **Zustand** per lo stato (attività, ipotesi, leve, scenario attivo)
- **Vitest** per il motore finanziario, la validazione e la codifica del link
- **@react-pdf/renderer** per il riepilogo PDF (route handler)
- **ESLint** + **Prettier**
- Deploy **Vercel**. Nessun database: lo stato vive nell'URL e in `localStorage` per gli scenari salvati
- Niente immagini stock, niente lorem ipsum, niente placeholder "TODO" visibili, niente dati finti evidenti ("Azienda Test")

## 3. Struttura del repository

```
src/
  app/
    layout.tsx, page.tsx              # simulatore (pagina unica)
    api/report/pdf/route.tsx          # POST scenario → PDF
  config/
    brand.ts                          # nome, logo SVG inline, colori, disclaimer
    templates.ts                      # attività tipo con numeri di partenza realistici (sez. 5)
    levers.ts                         # catalogo delle leve: etichette, range, unità, spiegazioni (sez. 6)
  domain/
    types.ts                          # Business, Assumptions, Lever, Scenario, MonthResult, Projection
    engine.ts                         # motore PURO: (assumptions, levers) → proiezione mensile
    kpis.ts                           # dagli output mensili ai KPI: pareggio, mese critico, runway, margine
    compare.ts                        # differenze base vs scenario, sensibilità (tornado), goal seek
    verdict.ts                        # frasi in italiano generate da regole (sez. 8)
    share.ts                          # codifica compatta dello scenario per l'URL
    *.test.ts
  store/
    scenario.ts                       # store Zustand + azioni + selettori memoizzati
  charts/
    CashCurve.tsx                     # curva della cassa, base vs scenario, area negativa evidenziata
    MonthlyBars.tsx                   # entrate/uscite per mese, con delta
    Tornado.tsx                       # quale leva pesa di più
    Sparkline.tsx                     # mini-grafico nei KPI
    primitives/                       # Axis, Grid, Tooltip, useChartSize, useAnimatedPath
  components/
    onboarding/                       # scelta attività, revisione numeri
    levers/                           # pannello leve: LeverSlider, LeverToggle, LeverGroup
    dashboard/                        # KpiTile, KpiStrip, Verdict, ScenarioBar (base/scenario/confronto)
    ui/                               # Button, Field, Segmented, Sheet, Tooltip, NumberInput
  lib/
    format.ts                         # euro, percentuali, mesi in italiano
    pdf/ReportDocument.tsx
```

**Regola di dipendenza**: `domain/` non importa nulla da React, Next o d3. Tutto ciò che è un numero nasce lì ed è testato lì.

## 4. Modello dati

```ts
type BusinessType = 'bar' | 'ristorante' | 'negozio' | 'artigiano' | 'studio' | 'ecommerce';

interface Assumptions {
  businessType: BusinessType;
  startMonth: number; // 1–12, mese di inizio della proiezione
  horizonMonths: 12 | 24;
  cashStart: number; // cassa iniziale, €
  revenueMonthly: number; // ricavi medi mensili, €
  seasonality: number[]; // 12 coefficienti (1 = mese medio); es. gelateria: estate 1.8, inverno 0.4
  cogsPct: number; // costo del venduto in % dei ricavi (materie prime, merce)
  staff: { count: number; costEachMonthly: number }; // costo aziendale, non netto
  rentMonthly: number;
  utilitiesMonthly: number;
  marketingMonthly: number;
  otherFixedMonthly: number;
  ownerDrawMonthly: number; // quanto il titolare preleva per vivere
  taxPct: number; // aliquota effettiva sull'utile (semplificata)
  loan?: { principal: number; ratePct: number; months: number; startMonth: number };
}

type Lever =
  | { kind: 'price'; pct: number; elasticity: number; from: number } // +5% prezzi; elasticità: quanti clienti perdi per ogni 1% di aumento
  | { kind: 'volume'; pct: number; from: number } // +10% clienti (es. campagna, nuova vetrina)
  | { kind: 'hire'; costMonthly: number; revenueUpliftPct: number; from: number }
  | { kind: 'fire'; costMonthly: number; revenueDropPct: number; from: number }
  | {
      kind: 'openDays';
      extraDaysPerWeek: number;
      revenuePerDayPct: number;
      extraCostMonthly: number;
      from: number;
    }
  | { kind: 'rent'; newRentMonthly: number; from: number }
  | { kind: 'supplier'; cogsPctDelta: number; from: number } // nuovo fornitore: −3 punti di costo del venduto
  | {
      kind: 'investment';
      amount: number;
      from: number;
      revenueUpliftPct: number;
      upliftFrom: number;
      financed?: { ratePct: number; months: number };
    }
  | {
      kind: 'marketing';
      monthly: number;
      from: number;
      to: number;
      revenueUpliftPct: number;
      lagMonths: number;
    }
  | { kind: 'ownerDraw'; monthly: number; from: number }
  | { kind: 'oneOffCost'; amount: number; month: number; label: string }
  | { kind: 'oneOffIncome'; amount: number; month: number; label: string };

interface Scenario {
  name: string;
  assumptions: Assumptions;
  levers: Lever[];
}

interface MonthResult {
  index: number;
  month: number;
  year: number;
  revenue: number;
  cogs: number;
  staff: number;
  fixed: number;
  marketing: number;
  loanPayment: number;
  ownerDraw: number;
  oneOffs: number;
  operatingProfit: number; // ricavi − costi operativi (prima di tasse, prelievi, rate)
  taxes: number;
  netCashFlow: number;
  cashEnd: number;
}

interface Projection {
  months: MonthResult[];
  kpis: Kpis;
}
interface Kpis {
  cashEnd: number;
  cashMin: number;
  cashMinMonth: number | null; // mese critico: primo mese con cassa < 0
  breakEvenMonth: number | null; // primo mese con utile operativo ≥ 0 stabile (3 mesi consecutivi)
  marginPct: number; // utile operativo / ricavi sull'orizzonte
  runwayMonths: number | null; // mesi prima che la cassa finisca, se il flusso è negativo
  totalRevenue: number;
  totalProfit: number;
}
```

## 5. Attività tipo (`templates.ts`)

Sei template con numeri **plausibili per l'Italia** (non inventati a caso: usa ordini di grandezza da fonti pubbliche tipo FIPE, Confcommercio, Confartigianato e dichiaralo in un commento):

| Attività                | Ricavi/mese | Cogs | Personale   | Affitto | Stagionalità               |
| ----------------------- | ----------- | ---- | ----------- | ------- | -------------------------- |
| Bar                     | 14.000 €    | 32%  | 2 × 2.100 € | 1.400 € | lieve, estate +15%         |
| Ristorante              | 38.000 €    | 34%  | 5 × 2.300 € | 2.800 € | estate +30%, gennaio −25%  |
| Negozio (abbigliamento) | 22.000 €    | 52%  | 1 × 2.000 € | 2.200 € | dicembre +60%, saldi       |
| Artigiano (impiantista) | 26.000 €    | 45%  | 2 × 2.600 € | 900 €   | agosto −50%                |
| Studio professionale    | 12.000 €    | 5%   | 1 × 1.900 € | 1.100 € | agosto −40%, dicembre −20% |
| E-commerce              | 30.000 €    | 58%  | 1 × 2.200 € | 600 €   | novembre-dicembre +80%     |

Ogni template ha anche: utenze, marketing, altri fissi, prelievo del titolare, aliquota, cassa iniziale, e **tre leve suggerite** ("le domande che si fa chi ha un bar": alzo il caffè di 10 cent? assumo un aiuto per l'estate? apro anche la domenica?), con valori già impostati.

## 6. Catalogo delle leve (`levers.ts`)

Per ogni leva: `id`, `label` in italiano da titolare ("Alzo i prezzi", "Assumo una persona", "Cambio fornitore", "Compro un macchinario", "Apro un giorno in più", "Faccio una campagna", "Riduco il mio prelievo", "Spesa una tantum", "Incasso una tantum"), `description` di una riga che spiega l'effetto (es. "Ogni 1% di aumento fa perdere in media lo 0,4% dei clienti: lo trovi sotto come _elasticità_, e puoi cambiarlo"), controlli con range e passo, unità, valori di default per tipo di attività, e **quale grafico si illumina** quando la leva è attiva.

Regole:

- Ogni leva ha un mese di inizio (`from`) scelto con un selettore di mesi, non con un numero.
- L'elasticità del prezzo è visibile e modificabile: è la cosa che un titolare capisce meglio di chiunque ("se alzo di 20 centesimi, quanti ne perdo?").
- Un investimento può essere pagato cash o finanziato (rata calcolata con ammortamento francese).
- Le leve si accumulano: lo scenario è la lista delle leve attive, ordinata per mese.

## 7. Motore (`domain/engine.ts`)

Funzione pura, deterministica, testata: `project(assumptions, levers): Projection`.

- Mese per mese: ricavi base × stagionalità del mese × effetti cumulati delle leve attive (prezzo con elasticità, volume, giorni di apertura, uplift di assunzioni/investimenti/marketing con ritardo `lagMonths`).
- Costi: cogs in % dei ricavi effettivi (con delta fornitore), personale (con assunzioni/licenziamenti dal mese `from`), fissi, marketing (base + campagne), rate di finanziamenti (base + investimenti finanziati), prelievo del titolare, una tantum.
- Tasse: calcolate **per anno solare** sull'utile operativo positivo cumulato dell'anno, pagate a giugno e novembre (acconto/saldo semplificati), mai negative. Documenta la semplificazione.
- Cassa: `cashEnd = cashStart + Σ netCashFlow`.
- KPI in `kpis.ts`: pareggio = primo mese da cui l'utile operativo resta ≥ 0 per 3 mesi consecutivi; mese critico = primo mese con cassa < 0; runway = mesi fino a cassa < 0 se il flusso medio è negativo; margine = utile operativo / ricavi.
- `compare.ts`: `diff(base, scenario)` per ogni KPI; **sensibilità** = per ogni leva attiva, la proiezione senza quella leva, così si vede quanto pesa (tornado); **goal seek**: `solve(lever, target)` per bisezione, es. "di quanto devo alzare i prezzi perché la cassa a dicembre sia ≥ 10.000 €?", con risultato in linguaggio umano.

Test obbligatori, con totali attesi **calcolati a mano** nel test e non copiati dall'output:

- attività senza leve: cassa finale = cassa iniziale + Σ flussi; stagionalità che somma a 12
- prezzo +10% con elasticità 0,4: ricavi × 1,10 × (1 − 0,04)
- assunzione da marzo: costo personale cambia da marzo e non prima
- investimento finanziato: rata coerente con la formula dell'ammortamento francese (verifica su un caso noto: 10.000 € al 6% in 24 mesi → 443,21 €/mese)
- tasse pagate solo a giugno/novembre e mai su utile negativo
- mese critico e pareggio su una serie costruita a mano
- goal seek converge entro 0,1 punti percentuali
- codifica/decodifica dello scenario senza perdite

## 8. Verdetto in italiano (`domain/verdict.ts`)

Da KPI e confronto, **2-4 frasi** generate da regole (non da un LLM), nel tono di un commercialista che ti vuole bene:

- "Con **+5% sui prezzi** e **un'assunzione da marzo**, la cassa resta positiva tutto l'anno e chiude a **18.400 €**, 6.200 € in più rispetto a oggi."
- "Attenzione: **a febbraio la cassa scende sotto zero** (−2.100 €). Il problema è la stagionalità di gennaio, non le leve: valuta di spostare l'assunzione a maggio."
- "Il punto di pareggio arriva **a giugno invece che a settembre**."
- "La leva che pesa di più è **il cambio fornitore**: da sola vale 4.800 € l'anno."

Le frasi hanno i numeri in grassetto e cambiano al volo. Struttura: esito (verde/ambra/rosso) → causa → suggerimento, dove esiste una regola che lo giustifica. Niente frasi generiche, niente punti esclamativi.

## 9. Grafici (`charts/`)

- **CashCurve**: asse dei mesi (nomi italiani abbreviati), curva base in grigio tratteggiato, curva scenario in colore pieno; l'area sotto zero è campita con tratteggio rosso; il mese critico ha un marcatore e un'etichetta; tooltip al passaggio con base vs scenario e differenza. **Quando lo scenario cambia, la curva si trasforma** (interpolazione dei punti in ~450 ms con easing, via `requestAnimationFrame`, senza librerie); la scala dell'asse y si adatta con la stessa transizione.
- **MonthlyBars**: per ogni mese due barre sottili (entrate, uscite) o una barra del flusso netto con colore per segno; clic su un mese → dettaglio delle voci.
- **Tornado**: barre orizzontali ordinate per impatto assoluto, colorate per segno, con la cifra a fianco; compare solo con ≥ 2 leve attive.
- **Sparkline** nei KPI: 12 punti, senza assi.
- Primitive comuni: `useChartSize` (ResizeObserver), `Axis`, `Grid` a linee sottili, `Tooltip` posizionato con clamp ai bordi, `useAnimatedPath` (interpola array di numeri).
- Accessibilità: ogni grafico ha `role="img"` con `aria-label` che riassume in una frase quello che mostra, e una **tabella nascosta** (`sr-only`) con i valori mensili.

## 10. Interfaccia e direzione visiva

**Direzione: quotidiano economico ben impaginato.** Carta chiara, inchiostro scuro, un solo colore di accento, numeri in colonna, molta gerarchia tipografica, grafici sobri. Riferimenti mentali: le pagine dati del Financial Times, le dashboard di Mercury e di Stripe. **Vietato**: dark mode con neon, glassmorphism, gradienti, card tutte uguali, icone emoji, grafici arcobaleno.

- **Tipografia**: display **"Newsreader"** (Google Fonts, serif, pesi 500-600, `opsz`) per titoli, KPI grandi e verdetto; testo **"Inter"** 400/500; numeri sempre `tabular-nums` (Inter ce li ha); niente monospace nell'interfaccia. Self-host con next/font.
- **Palette**: carta `#FBFAF6`, superficie `#FFFFFF`, inchiostro `#141A22`, secondario `#5F6772`, bordi `#E6E2DA`; **accento verde bosco `#1F6B4A`** per lo scenario e gli esiti positivi; **ambra `#B7791F`** per gli avvisi; **rosso mattone `#B33A2E`** per la cassa negativa; base/grigio `#9AA0A8` per la curva base. Nient'altro.
- **Layout desktop** (≥ 1024 px): tre zone. In alto una **barra scenario** sottile: nome attività, selettore "Base · Scenario · Confronto", pulsanti Salva / Condividi / PDF. Sotto, a sinistra il **pannello leve** (~36%, scrollabile, sticky), a destra il **cruscotto** (~64%): striscia di 4 KPI → verdetto → CashCurve grande → MonthlyBars e Tornado affiancati.
- **Layout mobile**: KPI in una striscia orizzontale sticky in alto, verdetto, grafico della cassa, poi le leve come **bottom sheet** trascinabile (il cruscotto resta visibile mentre muovi gli slider). Le leve inattive sono un elenco di chip "+ Alzo i prezzi"; attivandole si espandono.
- **Componenti**:
  - _KpiTile_: etichetta piccola in maiuscoletto, valore grande in Newsreader con animazione numerica (cifre che scorrono, 350 ms), delta rispetto alla base con freccia e colore, sparkline.
  - _LeverSlider_: etichetta, valore in evidenza modificabile anche a tastiera, slider con riempimento, selettore del mese di inizio a pillole (Gen … Dic), riga di spiegazione, pulsante "rimuovi". Mentre trascini, il grafico si aggiorna **a ogni frame** (throttle con rAF, mai debounce: la sensazione di causa-effetto è tutto il prodotto).
  - _Verdict_: blocco con bordo sinistro colorato per esito, frasi con numeri in grassetto, transizione di dissolvenza al cambio.
  - _Onboarding_ (prima visita): schermata a tutto schermo in due passi — griglia delle sei attività con icone SVG disegnate a mano → tabella dei numeri di partenza precompilati, modificabili inline ("Questi sono i numeri tipici di un bar: correggili con i tuoi"), con stagionalità come 12 barrette trascinabili. Pulsante "Vai al simulatore". Chi arriva da un link condiviso salta l'onboarding.
- **Micro-copy** in italiano, tono diretto: "quanto ti resta in cassa", "quando vai in pari", mai "EBITDA" senza spiegazione, mai punti esclamativi. Ogni termine tecnico ha un tooltip di una riga.
- **Stati**: vuoto ("Nessuna leva attiva: aggiungine una a sinistra per vedere cosa cambia"), scenario identico alla base, cassa negativa già nella base ("Attenzione: già oggi la cassa scende sotto zero a …"), valori fuori range con messaggio inline.
- **Accessibilità**: tutto da tastiera, focus visibile, contrasto AA, `prefers-reduced-motion` rispettato (niente animazioni numeriche o di curva).

## 11. Salvataggio, condivisione, PDF

- **URL**: lo scenario completo (ipotesi + leve) codificato in `?s=…` in forma compatta (non JSON in base64: numeri e indici separati, con versione in testa). Aggiornato con `replaceState` con debounce di 300 ms. Chi apre il link vede esattamente lo stesso scenario.
- **Scenari salvati**: in `localStorage`, con nome, data, KPI principali; lista nella barra scenario; confronto tra due scenari salvati (curve sovrapposte).
- **PDF** (`/api/report/pdf`): A4, 2 pagine: 1) attività, ipotesi, leve attive, verdetto, KPI base vs scenario; 2) tabella mensile completa. L'immagine della curva arriva dal client (serializza l'SVG → PNG con canvas, allegalo al body). Disclaimer: "Simulazione indicativa basata su ipotesi inserite dall'utente. Non costituisce consulenza fiscale o finanziaria."
- **Esporta CSV** della tabella mensile (lato client).

## 12. Qualità

- `npm run build` senza warning, `npm run lint` pulito, `npm test` verde
- Nessun `any`, nessun `// @ts-ignore`
- Componenti piccoli; nessun file oltre 250 righe
- Commenti in italiano solo dove spiegano una scelta non ovvia (perché le tasse a giugno/novembre, perché l'elasticità è lineare, perché rAF e non debounce)
- `README.md` in italiano: cos'è, come si avvia, come si aggiungono un template o una leva, le semplificazioni del motore e i loro limiti, come cambiare brand
- Lighthouse mobile ≥ 90 su tutte e quattro le categorie; OG image statica in `public/og.jpg` (uno screenshot del cruscotto con uno scenario interessante)
- Il motore deve calcolare 24 mesi con 8 leve in **meno di 2 ms**: la sensibilità (tornado) ricalcola N proiezioni per ogni movimento di slider

## 13. Fasi di lavoro

**Fase 1 — Motore.** Scaffold, `types.ts`, `templates.ts`, `levers.ts`, `engine.ts`, `kpis.ts`, `compare.ts`, `share.ts` con tutti i test della sezione 7 verdi. Una pagina provvisoria che stampa la tabella mensile del template "bar" con e senza la leva "prezzi +5%". _Consegna: test verdi, numeri controllati a mano._

**Fase 2 — Grafici.** Primitive e i quattro grafici con dati fittizi, in una pagina di prova; transizione animata tra due serie; tooltip; tabella sr-only. _Consegna: le curve si trasformano senza scatti, nessuna libreria di grafici._

**Fase 3 — Cruscotto e leve.** Store, layout desktop e mobile, KPI, verdetto, pannello leve completo con aggiornamento a ogni frame. _Consegna: si può costruire uno scenario intero da tastiera e da telefono._

**Fase 4 — Onboarding, template, condivisione.** Scelta attività, revisione numeri, stagionalità trascinabile, URL, scenari salvati, confronto. _Consegna: un link condiviso riapre lo scenario identico._

**Fase 5 — Report e rifinitura.** PDF con immagine della curva, CSV, stati vuoti, `prefers-reduced-motion`, OG, README, Lighthouse. _Consegna: build pulita, Lighthouse ≥ 90, README completo._

Parti dalla Fase 1. Prima di scrivere codice, mostrami in 20 righe: (a) come intendi calcolare l'effetto combinato di più leve sui ricavi (moltiplicativo o additivo, e perché), (b) la tabella mensile del template "bar" senza leve per i primi 4 mesi con cassa iniziale 8.000 €, calcolata a mano, (c) la stessa con "prezzi +5%, elasticità 0,4" da febbraio. Così validiamo il motore prima di tutto il resto.
