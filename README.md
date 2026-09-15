# Bussola — «cosa succede se» per piccole attività

Bussola è un simulatore di scenari per chi ha un bar, un ristorante, un negozio, una bottega artigiana, uno studio o un e-commerce. Descrivi l'attività con pochi numeri, muovi delle leve (alzo i prezzi, assumo una persona, apro la domenica, compro un macchinario…) e vedi in tempo reale cosa succede alla cassa, al margine e al punto di pareggio nei prossimi 12 o 24 mesi. Poi salvi, condividi con un link o scarichi il riepilogo in PDF.

Non serve un database: lo scenario vive nell'URL (`?s=…`) e gli scenari salvati in `localStorage`.

## Avvio

```bash
npm install
npm run dev
```

Poi apri [http://localhost:3000](http://localhost:3000).

| Comando                       | Cosa fa                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                 | server di sviluppo                                                                       |
| `npm run build` / `npm start` | build di produzione e avvio                                                              |
| `npm test`                    | test del motore, dei KPI, del confronto, del verdetto e della codifica del link (Vitest) |
| `npm run lint`                | ESLint                                                                                   |
| `npm run format`              | Prettier                                                                                 |

Deploy su Vercel senza configurazione: il route handler del PDF gira su Node.

## Com'è fatto

```
src/
  domain/      motore puro: tipi, engine, KPI, confronto e goal seek, verdetto, codifica URL, validazione
  config/      brand, template delle attività, catalogo delle leve
  store/       Zustand + selettori memoizzati (base, scenario, sensibilità, verdetto)
  charts/      grafici SVG scritti a mano (d3-scale/shape/array solo per scale e curve)
  components/  onboarding, pannello leve, cruscotto, primitive UI
  lib/         formattazione, persistenza, export CSV/PNG, documento PDF
  app/         pagina unica + POST /api/report/pdf
```

Regola di dipendenza: `domain/` non importa nulla da React, Next o d3. Ogni numero nasce lì ed è testato lì con totali calcolati a mano.

### Come funziona il motore (`domain/engine.ts`)

`project(assumptions, levers)` produce, mese per mese:

- **Ricavi** = ricavi medi × stagionalità del mese × Π fattori di prezzo × Π fattori di volume. Gli effetti delle leve sono **moltiplicativi**, quindi il risultato non dipende dall'ordine in cui le aggiungi.
- **Costo del venduto** segue solo il volume, non il prezzo: se alzi il caffè di 10 centesimi, il caffè in grani non costa di più.
- **Elasticità** lineare: ogni 1% di prezzo in più costa `elasticità`% di clienti. Approssimazione onesta per variazioni piccole, ed è l'unica che un titolare può stimare a occhio.
- **Costi**: personale (con assunzioni e riduzioni dal mese scelto), fissi (affitto, utenze, altri, costi extra di apertura), marketing (base + campagne), rate (finanziamento di partenza + investimenti a rate con ammortamento francese), prelievo del titolare, una tantum, investimenti pagati cash.
- **Tasse**: per anno solare sull'utile operativo positivo dell'anno, 40% a giugno e 60% a novembre.
- **Cassa** = cassa iniziale + Σ flussi netti.

I KPI (`domain/kpis.ts`): pareggio = primo mese da cui l'utile operativo resta ≥ 0 per tre mesi consecutivi; mese critico = primo mese con cassa < 0; runway = mesi prima che la cassa finisca, se il flusso medio è negativo; margine = utile operativo / ricavi sull'orizzonte.

`domain/compare.ts` fa la differenza tra base e scenario, la **sensibilità** (per ogni leva, la proiezione senza di lei: è il grafico «quale leva pesa di più») e il **goal seek** per bisezione (`solveLever`), ad esempio «di quanto devo alzare i prezzi perché la cassa a dicembre sia almeno 10.000 €».

### Semplificazioni e limiti (da sapere)

- Le tasse sono un'aliquota effettiva unica sull'utile operativo, con acconto a giugno calcolato sull'utile dell'anno in corso (come se l'anno precedente fosse identico). Niente IVA, niente INPS separato, niente crediti d'imposta: le scadenze che cadono prima dell'inizio della proiezione si considerano già pagate, quelle oltre l'orizzonte non entrano in cassa (l'ultima cassa può quindi essere un po' ottimista).
- Incassi e pagamenti sono nello stesso mese: nessun credito verso clienti né dilazione dai fornitori.
- L'elasticità è lineare e indipendente dalla stagione; il volume non può scendere sotto zero.
- L'effetto di assunzioni, investimenti e campagne è un aumento percentuale costante degli incassi: sta a chi usa lo strumento stimarlo con prudenza.
- Il costo del personale è un costo aziendale medio mensile (lordo + contributi), senza tredicesime, TFR o ferie separate.
- I mesi delle leve sono indici della proiezione (1 = primo mese), così con orizzonte a 24 mesi «marzo» non è ambiguo.

È una simulazione indicativa, non una consulenza fiscale o finanziaria.

## Aggiungere un template

In `src/config/templates.ts` aggiungi una voce con i numeri di partenza e in `src/config/suggested.ts` le tre leve suggerite («le domande che si fa chi ha un bar»), poi:

1. aggiungi il tipo in `BusinessType` e in `BUSINESS_TYPES` (`src/domain/types.ts`) — l'ordine di `BUSINESS_TYPES` è parte della codifica dell'URL, quindi aggiungi in coda;
2. disegna l'icona in `src/components/onboarding/BusinessIcons.tsx`;
3. imposta l'elasticità tipica in `ELASTICITY` (`src/config/levers.ts`).

La stagionalità deve sommare a 12: il test `la stagionalità di ogni template somma a 12` te lo ricorda.

## Aggiungere una leva

1. Aggiungi la variante al tipo `Lever` e il nome a `LEVER_KINDS` in `src/domain/types.ts` (in coda, per la stessa ragione dell'URL).
2. Implementa l'effetto in `applyLever` (`src/domain/engine.ts`) e scrivi un test con un numero calcolato a mano.
3. Elenca i campi da codificare in `LEVER_FIELDS` (`src/domain/share.ts`) e aggiungi la leva allo scenario di prova in `share.test.ts`.
4. Descrivila per il verdetto in `src/domain/describe.ts` (`describeLever` e `shortLabel`).
5. Aggiungi etichetta, descrizione e controlli in `src/config/levers.ts` (i controlli con unità `mese` diventano automaticamente un selettore di mesi, gli altri uno slider) e i valori di default in `src/config/leverDefaults.ts`.

## Cambiare brand

Tutto è in `src/config/brand.ts`: nome, tagline, descrizione, URL, disclaimer, logo (path SVG) e palette. I colori vanno ripetuti in `src/app/globals.css` (variabili `--paper`, `--ink`, `--accent`…), che è l'unico altro punto in cui compaiono. I font sono caricati con `next/font` in `src/app/layout.tsx`. L'immagine Open Graph è `public/og.jpg`.

## Condivisione e report

- **URL**: lo scenario completo è codificato in `?s=` come numeri e indici separati da `~`, `_` e `!` con la versione in testa (`src/domain/share.ts`), aggiornato con `replaceState` e un debounce di 300 ms. Chi apre il link vede lo stesso scenario e salta l'onboarding.
- **Scenari salvati**: `localStorage`, con nome, data e KPI; dal menu «Salvati» si riaprono, si eliminano o si sovrappongono alla curva della cassa.
- **PDF**: `POST /api/report/pdf` con `{ s, image }` — `s` è lo scenario codificato, `image` la curva serializzata dal client (SVG → PNG via canvas). Due pagine: riepilogo con ipotesi, leve, verdetto e KPI base/scenario; tabella mensile.
- **CSV**: tabella mensile generata lato client, separatore `;` e virgola decimale per Excel in italiano.

## Accessibilità e movimento

Tutto si usa da tastiera (slider, pillole dei mesi, barrette della stagionalità, menu). Ogni grafico ha `role="img"` con una frase riassuntiva e una tabella solo per screen reader con i valori mensili. Con `prefers-reduced-motion` le curve e i numeri non si animano.
