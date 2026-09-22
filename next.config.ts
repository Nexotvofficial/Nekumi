import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const cspHeader = `
    default-src 'self' https: http:;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;
    style-src 'self' 'unsafe-inline' https: http:;
    img-src 'self' blob: data: https: http:;
    font-src 'self' https: data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https: http:;
    connect-src 'self' https: http:;
    upgrade-insecure-requests;
`;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: true,
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'index, follow' },
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/manga.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/(.*).html',
        destination: '/',
        permanent: true,
      }
    ];
  },
};

export default withSerwist(nextConfig);
