import type { MetadataRoute } from 'next';
import { listProductsPage } from '@/lib/admik';
import { fetchCategories } from '@/lib/taxonomy-remote';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Каталог из Admik — карта сайта собирается динамически.
export const dynamic = 'force-dynamic';

/** Предел товаров в sitemap (защита от бесконечного цикла на большом каталоге). */
const MAX_PRODUCTS = 5000;
const PAGE = 100;

/**
 * Карта сайта: только канонические URL (комбинации фильтров не индексируются).
 * Категории и товары тянутся из Storefront API Admik.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages = ['', '/catalog', '/new', '/sale', '/delivery', '/about', '/contacts'].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    }),
  );

  let categoryPages: MetadataRoute.Sitemap = [];
  const productSlugs: string[] = [];
  try {
    const categories = await fetchCategories();
    categoryPages = categories.map((category) => ({
      url: `${BASE}/catalog/${category.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    for (let offset = 0; offset < MAX_PRODUCTS; offset += PAGE) {
      const { items, total } = await listProductsPage({ limit: PAGE, offset });
      for (const item of items) productSlugs.push(item.slug);
      if (offset + PAGE >= total || items.length === 0) break;
    }
  } catch {
    // Admik недоступен — отдаём хотя бы статические страницы.
  }

  const productPages = productSlugs.map((slug) => ({
    url: `${BASE}/product/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
