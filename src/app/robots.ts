import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // личные разделы и служебные страницы не индексируются
        disallow: ['/api/', '/account', '/account/', '/cart', '/checkout', '/order/', '/search'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
