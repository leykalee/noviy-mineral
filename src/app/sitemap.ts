import type { MetadataRoute } from 'next';
import { categories } from '@/data/demo/taxonomy';
import { products } from '@/data/demo/products';

import { siteUrl } from '@/lib/site-url';

const BASE = siteUrl;

/**
 * Карта сайта: только канонические URL.
 * Комбинации фильтров сюда не попадают (п.56 ТЗ).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/catalog', '/new', '/sale', '/delivery', '/about', '/contacts'].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    }),
  );

  const categoryPages = categories.map((category) => ({
    url: `${BASE}/catalog/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const productPages = products.map((product) => ({
    url: `${BASE}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
