import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@openstore/common',
    '@openstore/database',
    '@openstore/email',
    '@openstore/storage',
  ],
};

export default nextConfig;
