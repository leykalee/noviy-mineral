import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site-url';

const BASE = siteUrl;

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
