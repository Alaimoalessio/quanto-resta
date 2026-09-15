/**
 * Branding del prodotto: cambiare questo file basta per rinominare e
 * ricolorare il simulatore. I colori sono ripresi in `app/globals.css`
 * tramite variabili CSS con lo stesso nome.
 */
export const brand = {
  name: 'Quanto resta',
  tagline: 'Cosa succede se',
  description:
    'Il simulatore per chi ha una piccola attività: muovi una leva e vedi cosa succede alla cassa nei prossimi 12 mesi.',
  url: 'https://quanto-resta.vercel.app',
  colors: {
    paper: '#FBFAF6',
    surface: '#FFFFFF',
    ink: '#141A22',
    secondary: '#5F6772',
    border: '#E6E2DA',
    accent: '#1F6B4A',
    warning: '#B7791F',
    danger: '#B33A2E',
    base: '#9AA0A8',
  },
  disclaimer:
    'Simulazione indicativa basata su ipotesi inserite dall’utente. Non costituisce consulenza fiscale o finanziaria.',
  /** Logo: un cerchio con la fetta che resta, inline così finisce anche nel PDF e nell'OG. */
  logoPath:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4ZM12 12V5.6a6.4 6.4 0 0 1 5.9 8.9Z',
} as const;

export type Brand = typeof brand;
