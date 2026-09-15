import type { BusinessType } from '@/domain/types';

/** Icone a tratto disegnate a mano per le sei attività (24×24, stroke corrente). */
const PATHS: Record<BusinessType, React.ReactNode> = {
  bar: (
    <>
      <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z" />
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M8 4c0 1 .8 1 .8 2S8 7 8 8M11 4c0 1 .8 1 .8 2s-.8 1-.8 2" />
      <path d="M4 21h14" />
    </>
  ),
  ristorante: (
    <>
      <circle cx="12" cy="13" r="5.5" />
      <circle cx="12" cy="13" r="2.5" />
      <path d="M3 4v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V4M5 4v17" />
      <path d="M21 4c-1.5 0-3 2-3 5v3h3v9" />
    </>
  ),
  negozio: (
    <>
      <path d="M4 10 5.5 5h13L20 10" />
      <path d="M4 10c0 1.5 1 2.5 2.5 2.5S9 11.5 9 10c0 1.5 1.3 2.5 2.8 2.5S14.5 11.5 14.5 10c0 1.5 1.2 2.5 2.7 2.5S20 11.5 20 10" />
      <path d="M6 13v7h12v-7" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  artigiano: (
    <>
      <path d="M14.5 5.5a4 4 0 0 0-5 5L4 16a1.6 1.6 0 0 0 0 2.3l1.7 1.7A1.6 1.6 0 0 0 8 20l5.5-5.5a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6L14.5 5.5Z" />
    </>
  ),
  studio: (
    <>
      <path d="M6 4h9l4 4v12H6V4Z" />
      <path d="M15 4v4h4" />
      <path d="M9 12h7M9 15.5h7" />
    </>
  ),
  ecommerce: (
    <>
      <path d="M4 8l8-4 8 4v9l-8 4-8-4V8Z" />
      <path d="M4 8l8 4 8-4M12 12v9" />
      <path d="M8 6l8 4" />
    </>
  ),
};

export function BusinessIcon({ type, size = 36 }: { type: BusinessType; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[type]}
    </svg>
  );
}
