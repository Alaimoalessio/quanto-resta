import { brand } from '@/config/brand';

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d={brand.logoPath} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
