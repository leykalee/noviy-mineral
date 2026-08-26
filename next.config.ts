import type { NextConfig } from 'next';

/**
 * Заголовки безопасности живут здесь, а не в конфиге хостинга: так они
 * едут вместе с проектом и не теряются при смене площадки.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/**
 * Хост медиа Admik для next/image. Фото товаров отдаются с публичного адреса
 * Admik (S3_PUBLIC_URL → Caddy → MinIO), поэтому его нужно разрешить в
 * remotePatterns. Берём из NEXT_PUBLIC_ADMIK_API_URL (адрес API/медиа Admik).
 */
function admikImagePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const raw = process.env.NEXT_PUBLIC_ADMIK_API_URL;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [
      {
        protocol: u.protocol.replace(':', '') as 'http' | 'https',
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: '/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Standalone-сборка для контейнера (docker-стенд Admik, сервис storefront).
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 390, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [96, 128, 200, 256, 320, 400, 512],
    remotePatterns: admikImagePatterns(),
  },
  typedRoutes: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
