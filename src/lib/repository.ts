import 'server-only';

import type {
  CatalogFacets,
  CatalogQuery,
  CatalogResult,
  Category,
  FacetValue,
  Product,
  ProductFeature,
  SortKey,
} from '@/types';
import {
  categories,
  categoryBranchIds,
  categoryBySlug,
  colorById,
  depositById,
  depositBySlug,
  featureLabels,
  mineralById,
  mineralBySlug,
} from '@/data/demo/taxonomy';
import { productBySlug, products } from '@/data/demo/products';
import { DEFAULT_PER_PAGE, DEFAULT_SORT, MAX_PER_PAGE } from '@/lib/catalog-query';

/**
 * Слой доступа к данным.
 *
 * Сейчас источник — demo-массив в памяти, но весь остальной код обращается только сюда.
 * Чтобы перейти на PostgreSQL, достаточно заменить тела функций на запросы Drizzle
 * (схема уже описана в src/db/schema.ts) — сигнатуры менять не придётся.
 *
 * Важно: фильтрация, поиск и пагинация выполняются ЗДЕСЬ, на сервере (п.57 ТЗ).
 * В браузер уезжает только одна страница выдачи, а не весь каталог.
 */

/** Наибольший габарит экземпляра — по нему работает фильтр «размер» */
function maxDimension(p: Product): number | undefined {
  const dims = [p.width, p.height, p.depth].filter(
    (v): v is number => typeof v === 'number' && v > 0,
  );
  return dims.length ? Math.max(...dims) : undefined;
}

function matches(product: Product, query: CatalogQuery, categoryIds?: Set<string>): boolean {
  if (categoryIds && !categoryIds.has(product.categoryId)) return false;

  if (query.mineral?.length) {
    const slug = product.mineralId ? mineralById.get(product.mineralId)?.slug : undefined;
    if (!slug || !query.mineral.includes(slug)) return false;
  }
  if (query.deposit?.length) {
    const slug = product.depositId ? depositById.get(product.depositId)?.slug : undefined;
    if (!slug || !query.deposit.includes(slug)) return false;
  }
  if (query.country?.length && (!product.country || !query.country.includes(product.country))) {
    return false;
  }
  if (query.region?.length && (!product.region || !query.region.includes(product.region))) {
    return false;
  }
  if (query.color?.length) {
    if (!product.colors?.some((c) => query.color!.includes(c))) return false;
  }
  if (query.feature?.length) {
    if (!product.features?.some((f) => query.feature!.includes(f))) return false;
  }

  if (typeof query.priceFrom === 'number' && product.price < query.priceFrom) return false;
  if (typeof query.priceTo === 'number' && product.price > query.priceTo) return false;

  if (typeof query.sizeFrom === 'number' || typeof query.sizeTo === 'number') {
    const size = maxDimension(product);
    if (size === undefined) return false;
    if (typeof query.sizeFrom === 'number' && size < query.sizeFrom) return false;
    if (typeof query.sizeTo === 'number' && size > query.sizeTo) return false;
  }

  if (typeof query.weightFrom === 'number' || typeof query.weightTo === 'number') {
    if (product.weight === undefined) return false;
    if (typeof query.weightFrom === 'number' && product.weight < query.weightFrom) return false;
    if (typeof query.weightTo === 'number' && product.weight > query.weightTo) return false;
  }

  if (query.inStock && (product.status !== 'available' || product.stock <= 0)) return false;
  if (query.isNew && !product.isNew) return false;
  if (query.onSale && !(product.oldPrice && product.oldPrice > product.price)) return false;

  if (query.q) {
    if (!textMatches(product, query.q)) return false;
  }

  return true;
}

/** Поисковый индекс товара: название, артикул, минерал, месторождение, страна, регион, категория */
function searchHaystack(product: Product): string {
  const mineral = product.mineralId ? mineralById.get(product.mineralId) : undefined;
  const deposit = product.depositId ? depositById.get(product.depositId) : undefined;
  return [
    product.name,
    product.sku,
    product.shortDescription,
    mineral?.name,
    deposit?.name,
    product.country,
    product.region,
    product.material,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

function textMatches(product: Product, q: string): boolean {
  const haystack = normalize(searchHaystack(product));
  // все слова запроса должны найтись — «флюорит дальнегорск» сужает выдачу, а не расширяет
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru'),
  new: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
};

function countBy(items: Product[], pick: (p: Product) => string[] | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const value of pick(item) ?? []) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

function toFacet(
  counts: Map<string, number>,
  label: (value: string) => string | undefined,
  hex?: (value: string) => string | undefined,
): FacetValue[] {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value) ?? value, count, hex: hex?.(value) }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
}

/**
 * Фасеты считаются по выборке, ограниченной категорией и поисковым запросом,
 * но БЕЗ учёта самих фильтров — иначе, выбрав «флюорит», пользователь потерял бы
 * возможность добавить второй минерал.
 */
function buildFacets(pool: Product[]): CatalogFacets {
  const prices = pool.map((p) => p.price);
  return {
    mineral: toFacet(
      countBy(pool, (p) => (p.mineralId ? [mineralById.get(p.mineralId)?.slug ?? ''] : [])),
      (slug) => mineralBySlug.get(slug)?.name,
    ),
    country: toFacet(
      countBy(pool, (p) => (p.country ? [p.country] : [])),
      (v) => v,
    ),
    region: toFacet(
      countBy(pool, (p) => (p.region ? [p.region] : [])),
      (v) => v,
    ),
    deposit: toFacet(
      countBy(pool, (p) => (p.depositId ? [depositById.get(p.depositId)?.slug ?? ''] : [])),
      (slug) => depositBySlug.get(slug)?.name,
    ),
    color: toFacet(
      countBy(pool, (p) => p.colors),
      (id) => colorById.get(id)?.name,
      (id) => colorById.get(id)?.hex,
    ),
    feature: toFacet(
      countBy(pool, (p) => p.features),
      (id) => featureLabels[id],
    ),
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  };
}

export interface QueryProductsOptions {
  /** slug категории; включает все подкатегории ветки */
  categorySlug?: string;
}

export async function queryProducts(
  query: CatalogQuery,
  options: QueryProductsOptions = {},
): Promise<CatalogResult> {
  const categoryIds = options.categorySlug
    ? new Set(
        (() => {
          const category = categoryBySlug.get(options.categorySlug);
          return category ? categoryBranchIds(category.id) : [];
        })(),
      )
    : undefined;

  // выборка, на которой считаются фасеты: категория + текстовый запрос, без фильтров
  const pool = products.filter(
    (p) =>
      (!categoryIds || categoryIds.has(p.categoryId)) && (!query.q || textMatches(p, query.q)),
  );

  const filtered = pool.filter((p) => matches(p, query, categoryIds));

  const sort = query.sort ?? DEFAULT_SORT;
  const sorted = [...filtered].sort(sorters[sort]);

  const perPage = Math.min(query.perPage ?? DEFAULT_PER_PAGE, MAX_PER_PAGE);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);
  const items = sorted.slice((page - 1) * perPage, page * perPage);

  return { items, total, page, perPage, pageCount, facets: buildFacets(pool) };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return productBySlug.get(slug) ?? null;
}

/** Новинки для главной */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return [...products]
    .filter((p) => p.isNew)
    .sort(sorters.new)
    .slice(0, limit);
}

/** Товары со скидкой — для /sale */
export async function getSaleProducts(limit?: number): Promise<Product[]> {
  const items = products
    .filter((p) => p.oldPrice && p.oldPrice > p.price)
    .sort((a, b) => b.popularity - a.popularity);
  return limit ? items.slice(0, limit) : items;
}

/**
 * Похожие экземпляры: сначала тот же минеральный вид, затем та же категория.
 * Проданные и зарезервированные в подборку не попадают — она нужна как замена.
 */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const score = (candidate: Product): number => {
    let value = 0;
    if (candidate.mineralId && candidate.mineralId === product.mineralId) value += 100;
    if (candidate.categoryId === product.categoryId) value += 50;
    if (candidate.depositId && candidate.depositId === product.depositId) value += 25;
    if (candidate.country && candidate.country === product.country) value += 10;
    // близкие по цене — на 30 % ближе к верху
    value += Math.max(0, 20 - Math.abs(candidate.price - product.price) / Math.max(product.price, 1) * 20);
    return value;
  };

  return products
    .filter((p) => p.id !== product.id && p.status === 'available' && p.stock > 0)
    .map((p) => ({ p, score: score(p) }))
    .filter((x) => x.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const map = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
}

/** Товары, отобранные вручную для витрины главной */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return products
    .filter((p) => p.isFeatured)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Сколько товаров в ветке категории — для счётчиков в меню и на плитках */
export async function countProductsInCategory(categorySlug: string): Promise<number> {
  const category = categoryBySlug.get(categorySlug);
  if (!category) return 0;
  const ids = new Set(categoryBranchIds(category.id));
  return products.filter((p) => ids.has(p.categoryId)).length;
}

/** Сколько экземпляров данного минерального вида сейчас в каталоге */
export async function countProductsByMineral(mineralSlug: string): Promise<number> {
  const mineral = mineralBySlug.get(mineralSlug);
  if (!mineral) return 0;
  return products.filter((p) => p.mineralId === mineral.id).length;
}

/**
 * Слайды первого экрана — разделы каталога верхнего уровня.
 *
 * Первый экран сам работает навигацией по каталогу, поэтому отдельного
 * блока с плитками разделов на главной нет: он бы повторял слайдер.
 * Раздел без фотографии пропускаем — слайд держится на снимке.
 */
export interface HeroSlide {
  slug: string;
  /** Короткая подпись для крупного набора на слайде */
  title: string;
  /** Полное название раздела — для подписи точки переключения */
  name: string;
  image: NonNullable<Category['image']>;
  /** Сколько экземпляров в ветке раздела */
  count: number;
}

/**
 * Полные названия разделов набраны прописными в 78 px и занимают две-три
 * строки — крупный заголовок перестаёт читаться с одного взгляда. На слайде
 * ставим короткое слово, полное название остаётся в меню и в каталоге.
 */
const HERO_TITLES: Record<string, string> = {
  minerals: 'Минералы',
  crafts: 'Изделия',
  jewelry: 'Украшения',
  books: 'Книги',
  accessories: 'Сопутствующие',
};

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order)
    .flatMap((category) => {
      const image = category.image;
      if (!image) return [];
      const ids = new Set(categoryBranchIds(category.id));
      const count = products.filter((p) => ids.has(p.categoryId)).length;
      if (count === 0) return [];
      return [
        {
          slug: category.slug,
          title: HERO_TITLES[category.slug] ?? category.name,
          name: category.name,
          image,
          count,
        },
      ];
    });
}

export type { ProductFeature };
