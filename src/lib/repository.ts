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
 * Слой доступа к данным. Источник — Storefront API Admik (`/api/storefront/v1/*`),
 * витрина работает как чистый потребитель (docs Admik 13, ADR-008). Своей БД у
 * витрины нет: каталог/цены/наличие/заказы — на стороне Admik.
 *
 * Что умеет фильтровать серверный API: категория (slug), поиск (q), флаги
 * new/sale/featured, пагинация. Атрибутные фасеты «Нового Минерала» (минерал,
 * месторождение, страна, регион, цвет, признаки, размер/вес, диапазон цены) в
 * каноне Admik отсутствуют — это ЭТАП 2 (нужны атрибутные фильтры и агрегация
 * фасетов на бэкенде Admik). Здесь такие фильтры к пагинации НЕ применяются,
 * чтобы не ломать серверный total; сортировка выполняется по странице выдачи.
 *
 * Идентификатор вью-модели `Product.id` = slug (стабильный публичный ключ —
 * одинаков для карточки каталога и полной карточки; на нём держатся корзина и
 * избранное). uuid товара Admik для оформления заказа резолвится в момент
 * оформления по slug (см. api/orders).
 */

const pageSorters: Record<SortKey, (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru'),
  // createdAt из API не приходит — «новизну» держит флаг isNew, дальше по имени.
  new: (a, b) => Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name, 'ru'),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
};

/** Минимальные фасеты по странице выдачи: реальный диапазон цен + цвета из list-DTO. */
function buildFacets(items: Product[]): CatalogFacets {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  const colorCounts = new Map<string, number>();
  for (const p of items) {
    for (const c of p.colors ?? []) colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
  }
  const color: FacetValue[] = [...colorCounts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
  return {
    mineral: [],
    country: [],
    region: [],
    deposit: [],
    color,
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

  return { items, total, page, perPage, pageCount, facets: buildFacets(items) };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const dto = await getProduct(slug);
  return dto ? fromDetail(dto) : null;
}

/** Новинки для главной. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const dtos = await listProducts({ isNew: true, limit });
  return dtos.map(fromListItem);
}

/** Товары со скидкой — для /sale. */
export async function getSaleProducts(limit?: number): Promise<Product[]> {
  const dtos = await listProducts({ sale: true, limit: limit ?? MAX_PER_PAGE });
  return dtos.map(fromListItem);
}

/**
 * Похожие экземпляры: та же категория (серверный фасет Admik), без текущего
 * товара. Мономинеральное сходство (тот же вид/месторождение) — ЭТАП 2:
 * требует атрибутных фильтров на бэкенде Admik.
 */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const category = product.categoryId;
  const dtos = category
    ? await listProducts({ category, limit: limit + 1 })
    : await listProducts({ featured: true, limit: limit + 1 });
  return dtos
    .map(fromListItem)
    .filter((p) => p.slug !== product.slug && p.status !== 'sold_out')
    .slice(0, limit);
}

/**
 * Товары по идентификаторам (корзина/избранное). id вью-модели = slug, поэтому
 * тянем полные карточки по slug и сохраняем порядок запроса.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const dto = await getProduct(id);
      return dto ? fromDetail(dto) : null;
    }),
  );
  return results.filter((p): p is Product => Boolean(p));
}

/** Товары, отобранные вручную для витрины главной. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const dtos = await listProducts({ featured: true, limit });
  return dtos.map(fromListItem);
}

/** Сколько товаров в категории — для счётчиков в меню и на плитках. */
export async function countProductsInCategory(categorySlug: string): Promise<number> {
  const { total } = await listProductsPage({ category: categorySlug, limit: 1 });
  return total;
}

/**
 * Сколько экземпляров минерального вида в каталоге. ЭТАП 2: Storefront API Admik
 * не фильтрует по атрибуту «минерал», поэтому счётчик недоступен → 0.
 */
export async function countProductsByMineral(_mineralSlug: string): Promise<number> {
  return 0;
}

// ---------------------------------------------------------------------------
// Слайды первого экрана (тёмная карусель разделов, дизайн по rusmineral.ru).
// ---------------------------------------------------------------------------

export interface HeroSlide {
  slug: string;
  /** Короткая подпись для крупного набора на слайде */
  title: string;
  /** Полное название раздела — для подписи точки переключения */
  name: string;
  image: NonNullable<Category['image']>;
  /** Сколько экземпляров в разделе */
  count: number;
}

const HERO_TITLES: Record<string, string> = {
  minerals: 'Минералы',
  crafts: 'Изделия',
  jewelry: 'Украшения',
  books: 'Книги',
  accessories: 'Сопутствующие',
};

/**
 * Слайды карусели строятся из корневых категорий Admik. Картинок у категорий в
 * Storefront API нет, поэтому фон слайда — фото первого товара раздела (реальная
 * витринная картинка). Пустые разделы и разделы без единого фото пропускаем.
 */
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
