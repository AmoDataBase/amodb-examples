import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    // Posters, backdrops and profile photos are served from the amodb image host.
    remotePatterns: [{ protocol: 'https', hostname: 'img.amodb.dev', pathname: '/t/p/**' }],
  },
};

export default config;
