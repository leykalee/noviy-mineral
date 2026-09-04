import 'server-only';

import type {
  Category,
  CatalogFacets,
  CatalogResult,
  CatalogQuery,
  FacetValue,
  Product,
  ProductFeature,
  ProductImage,
  SortKey,
} from '@/types';
import {
  fromDetail,
  fromListItem,
  getProduct,
  listProducts,
  listProductsPage,
} from '@/lib/admik';
import { fetchRootCategories } from '@/lib/taxonomy-remote';
import { DEFAULT_PER_PAGE, DEFAULT_SORT, MAX_PER_PAGE } from '@/lib/catalog-query';

/**
 * Слой доступа к данным. Источник — Storefront API Admik. Каталог отдаётся
 * СЕРВЕРНОЙ пагинацией (масштаб на тысячи SKU): фильтрация по категории/поиску/
 * флагам и разбивка по страницам — на бэкенде Admik, в браузер едет только одна
 * страница выдачи. Атрибутные фасеты сайдбара (минерал/цвет/…) требуют доработки
 * бэкенда Admik и здесь не строятся.
 *
 * `Product.id` = slug; uuid товара для заказа резолвится по slug в api/orders.
 */

const pageSorters: Record<SortKey, (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru'),
  new: (a, b) => Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name, 'ru'),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
};

function emptyFacets(items: Product[]): CatalogFacets {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  return {
    mineral: [] as FacetValue[],
    country: [],
    region: [],
    deposit: [],
    color: [],
    feature: [],
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  };
}

export interface QueryProductsOptions {
  /** slug категории; серверный фасет каталога Admik (резолвит slug→id). */
  categorySlug?: string;
}

export async function queryProducts(
  query: CatalogQuery,
  options: QueryProductsOptions = {},
): Promise<CatalogResult> {
  const perPage = Math.min(query.perPage ?? DEFAULT_PER_PAGE, MAX_PER_PAGE);
  const page = Math.max(query.page ?? 1, 1);
  const offset = (page - 1) * perPage;

  const { items: dtos, total } = await listProductsPage({
    q: query.q,
    category: options.categorySlug ?? query.category,
    isNew: query.isNew || undefined,
    sale: query.onSale || undefined,
    limit: perPage,
    offset,
  });

  let items = dtos.map(fromListItem);
  if (query.inStock) items = items.filter((p) => p.status !== 'sold_out');
  const sort = query.sort ?? DEFAULT_SORT;
  items = [...items].sort(pageSorters[sort]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  return { items, total, page, perPage, pageCount, facets: emptyFacets(items) };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const dto = await getProduct(slug);
  return dto ? fromDetail(dto) : null;
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const dtos = await listProducts({ isNew: true, limit });
  return dtos.map(fromListItem);
}

export async function getSaleProducts(limit?: number): Promise<Product[]> {
  const dtos = await listProducts({ sale: true, limit: limit ?? MAX_PER_PAGE });
  return dtos.map(fromListItem);
}

export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const dtos = product.categoryId
    ? await listProducts({ category: product.categoryId, limit: limit + 1 })
    : await listProducts({ featured: true, limit: limit + 1 });
  return dtos
    .map(fromListItem)
    .filter((p) => p.slug !== product.slug && p.status !== 'sold_out')
    .slice(0, limit);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const dto = await getProduct(id);
      return dto ? fromDetail(dto) : null;
    }),
  );
  return results.filter((p): p is Product => Boolean(p));
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const dtos = await listProducts({ featured: true, limit });
  return dtos.map(fromListItem);
}

export async function countProductsInCategory(categorySlug: string): Promise<number> {
  const { total } = await listProductsPage({ category: categorySlug, limit: 1 });
  return total;
}

export async function countProductsByMineral(_mineralSlug: string): Promise<number> {
  return 0;
}

// ---------------------------------------------------------------------------
// Слайды первого экрана (тёмная карусель разделов).
// ---------------------------------------------------------------------------

export interface HeroSlide {
  slug: string;
  title: string;
  name: string;
  image: NonNullable<Category['image']>;
  count: number;
}

const HERO_TITLES: Record<string, string> = {
  minerals: 'Минералы',
  crafts: 'Изделия',
  jewelry: 'Украшения',
  books: 'Книги',
  accessories: 'Сопутствующие',
};

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const roots = await fetchRootCategories();
  const slides = await Promise.all(
    roots.map(async (category): Promise<HeroSlide | null> => {
      const { items, total } = await listProductsPage({ category: category.slug, limit: 1 });
      const url = items[0]?.imageUrl;
      if (total === 0 || !url) return null;
      const image: ProductImage = { url, alt: category.name, width: 1600, height: 1000 };
      return {
        slug: category.slug,
        title: HERO_TITLES[category.slug] ?? category.name,
        name: category.name,
        image,
        count: total,
      };
    }),
  );
  return slides.filter((s): s is HeroSlide => s !== null);
}

export type { ProductFeature };
