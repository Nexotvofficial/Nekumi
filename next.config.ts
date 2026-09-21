import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow', // Evita que Google indexe la web si está en pruebas
          },
        ],
      },
    ];
  },
};

export default nextConfig;
