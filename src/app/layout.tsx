import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { brand } from '@/config/brand';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.description,
  metadataBase: new URL(brand.url),
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: ['/og.jpg'],
    locale: 'it_IT',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: brand.colors.paper };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
