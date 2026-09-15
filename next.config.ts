import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa API Node (stream, zlib): va lasciato fuori dal bundle.
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
