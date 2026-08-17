import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 390, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [96, 128, 200, 256, 320, 400, 512],
  },
  typedRoutes: false,
};

export default nextConfig;
