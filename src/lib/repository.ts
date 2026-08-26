import 'server-only';

import type {
  Category,
  CatalogFacets,
  CatalogResult,
  CatalogQuery,
  FacetValue,
  Product,
  ProductFeature,
  SortKey,
} from '@/types';
import { fromDetail, getProduct, listProductsPage } from '@/lib/admik';
import { fetchCategories } from '@/lib/taxonomy-remote';
import { featureLabels } from '@/data/demo/taxonomy';
import { DEFAULT_PER_PAGE, DEFAULT_SORT, MAX_PER_PAGE } from '@/lib/catalog-query';

/**
 * Слой доступа к данным. Источник — Storefront API Admik (`/api/storefront/v1/*`),
 * витрина работает как чистый потребитель. Каталог целиком загружается из Admik
 * (со всеми характеристиками) и фильтруется/фасетится/сортируется на сервере —
 * так витрина воспроизводит полный каталог с фильтрами по минералу,
 * месторождению, стране, цвету, признакам, цене, размеру и весу.
 *
 * `Product.id` = slug (стабильный публичный ключ; на нём держатся корзина и
 * избранное). uuid товара Admik для заказа резолвится по slug в api/orders.
 */

// ---------------------------------------------------------------------------
// Загрузка всего каталога из Admik (с кешем на короткое время).
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000;
let cache: { at: number; products: Product[] } | null = null;
let categoriesCache: { at: number; list: Category[] } | null = null;

async function allCategories(): Promise<Category[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CACHE_TTL_MS) {
    return categoriesCache.list;
  }
  const list = await fetchCategories();
  categoriesCache = { at: Date.now(), list };
  return list;
}

async function loadAllProducts(): Promise<Product[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.products;

  const slugs: string[] = [];
  const PAGE = 100;
  for (let offset = 0; offset < 10000; offset += PAGE) {
    const { items, total } = await listProductsPage({ limit: PAGE, offset });
    for (const it of items) slugs.push(it.slug);
    if (offset + PAGE >= total || items.length === 0) break;
  }

  const details = await Promise.all(slugs.map((s) => getProduct(s).catch(() => null)));
  const products = details.filter(Boolean).map((dto) => fromDetail(dto!));
  cache = { at: Date.now(), products };
  return products;
}

/** slug категории + все её подкатегории (ветка), для фильтра каталога. */
async function categoryBranchSlugs(slug: string): Promise<Set<string>> {
  const cats = await allCategories();
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c.slug);
      childrenOf.set(c.parentId, arr);
    }
  }
  const branch = new Set<string>();
  const stack = [slug];
  while (stack.length) {
    const s = stack.pop()!;
    if (branch.has(s)) continue;
    branch.add(s);
    for (const child of childrenOf.get(s) ?? []) stack.push(child);
  }
  return branch;
}

// ---------------------------------------------------------------------------
// Фильтрация / поиск / сортировка / фасеты (в памяти, как в макете).
// ---------------------------------------------------------------------------

function maxDimension(p: Product): number | undefined {
  const dims = [p.width, p.height, p.depth].filter(
    (v): v is number => typeof v === 'number' && v > 0,
  );
  return dims.length ? Math.max(...dims) : undefined;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

function searchHaystack(p: Product): string {
  return [
    p.name, p.sku, p.shortDescription, p.mineralName, p.depositName,
    p.country, p.region, p.material,
  ].filter(Boolean).join(' ').toLowerCase();
}

function textMatches(p: Product, q: string): boolean {
  const haystack = normalize(searchHaystack(p));
  return normalize(q).split(/\s+/).filter(Boolean).every((t) => haystack.includes(t));
}

function matches(p: Product, query: CatalogQuery, branch?: Set<string>): boolean {
  if (branch && !branch.has(p.categoryId)) return false;
  if (query.mineral?.length && !(p.mineralId && query.mineral.includes(p.mineralId))) return false;
  if (query.deposit?.length && !(p.depositId && query.deposit.includes(p.depositId))) return false;
  if (query.country?.length && !(p.country && query.country.includes(p.country))) return false;
  if (query.region?.length && !(p.region && query.region.includes(p.region))) return false;
  if (query.color?.length && !p.colors?.some((c) => query.color!.includes(c))) return false;
  if (query.feature?.length && !p.features?.some((f) => query.feature!.includes(f))) return false;
  if (typeof query.priceFrom === 'number' && p.price < query.priceFrom) return false;
  if (typeof query.priceTo === 'number' && p.price > query.priceTo) return false;
  if (typeof query.sizeFrom === 'number' || typeof query.sizeTo === 'number') {
    const size = maxDimension(p);
    if (size === undefined) return false;
    if (typeof query.sizeFrom === 'number' && size < query.sizeFrom) return false;
    if (typeof query.sizeTo === 'number' && size > query.sizeTo) return false;
  }
  if (typeof query.weightFrom === 'number' || typeof query.weightTo === 'number') {
    if (p.weight === undefined) return false;
    if (typeof query.weightFrom === 'number' && p.weight < query.weightFrom) return false;
    if (typeof query.weightTo === 'number' && p.weight > query.weightTo) return false;
  }
  if (query.inStock && (p.status !== 'available' || p.stock <= 0)) return false;
  if (query.isNew && !p.isNew) return false;
  if (query.onSale && !(p.oldPrice && p.oldPrice > p.price)) return false;
  if (query.q && !textMatches(p, query.q)) return false;
  return true;
}

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru'),
  new: (a, b) => Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name, 'ru'),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
};

function countBy(items: Product[], pick: (p: Product) => [string, string][]): FacetValue[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const item of items) {
    for (const [value, label] of pick(item)) {
      const cur = counts.get(value) ?? { label, count: 0 };
      cur.count += 1;
      counts.set(value, cur);
    }
  }
  return [...counts.entries()]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
}

function buildFacets(pool: Product[]): CatalogFacets {
  const prices = pool.map((p) => p.price).filter((n) => n > 0);
  return {
    mineral: countBy(pool, (p) => (p.mineralId && p.mineralName ? [[p.mineralId, p.mineralName]] : [])),
    country: countBy(pool, (p) => (p.country ? [[p.country, p.country]] : [])),
    region: countBy(pool, (p) => (p.region ? [[p.region, p.region]] : [])),
    deposit: countBy(pool, (p) => (p.depositId && p.depositName ? [[p.depositId, p.depositName]] : [])),
    color: countBy(pool, (p) => (p.colors ?? []).map((c) => [c, c] as [string, string])),
    feature: countBy(pool, (p) => (p.features ?? []).map((f) => [f, featureLabels[f] ?? f] as [string, string])),
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
  };
}

export interface QueryProductsOptions {
  /** slug категории; включает все подкатегории ветки. */
  categorySlug?: string;
}

export async function queryProducts(
  query: CatalogQuery,
  options: QueryProductsOptions = {},
): Promise<CatalogResult> {
  const [all, branch] = await Promise.all([
    loadAllProducts(),
    options.categorySlug ? categoryBranchSlugs(options.categorySlug) : Promise.resolve(undefined),
  ]);

  // Пул для фасетов: категория + поиск, без остальных фильтров (чтобы можно было
  // добрать второе значение фильтра).
  const pool = all.filter(
    (p) => (!branch || branch.has(p.categoryId)) && (!query.q || textMatches(p, query.q)),
  );
  const filtered = pool.filter((p) => matches(p, query, branch));

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
  const dto = await getProduct(slug);
  return dto ? fromDetail(dto) : null;
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const all = await loadAllProducts();
  return [...all].filter((p) => p.isNew).sort(sorters.popular).slice(0, limit);
}

export async function getSaleProducts(limit?: number): Promise<Product[]> {
  const all = await loadAllProducts();
  const items = all
    .filter((p) => p.oldPrice && p.oldPrice > p.price)
    .sort((a, b) => b.popularity - a.popularity);
  return limit ? items.slice(0, limit) : items;
}

export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const all = await loadAllProducts();
  const score = (c: Product): number => {
    let v = 0;
    if (c.mineralId && c.mineralId === product.mineralId) v += 100;
    if (c.categoryId === product.categoryId) v += 50;
    if (c.depositId && c.depositId === product.depositId) v += 25;
    if (c.country && c.country === product.country) v += 10;
    v += Math.max(0, 20 - (Math.abs(c.price - product.price) / Math.max(product.price, 1)) * 20);
    return v;
  };
  return all
    .filter((p) => p.slug !== product.slug && p.status === 'available' && p.stock > 0)
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 20)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const all = await loadAllProducts();
  const map = new Map(all.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await loadAllProducts();
  return all.filter((p) => p.isFeatured).sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export async function countProductsInCategory(categorySlug: string): Promise<number> {
  const [all, branch] = await Promise.all([loadAllProducts(), categoryBranchSlugs(categorySlug)]);
  return all.filter((p) => branch.has(p.categoryId)).length;
}

export async function countProductsByMineral(mineralSlug: string): Promise<number> {
  const all = await loadAllProducts();
  return all.filter((p) => p.mineralId === mineralSlug).length;
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
  const [cats, all] = await Promise.all([allCategories(), loadAllProducts()]);
  const roots = cats.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
  const slides: HeroSlide[] = [];
  for (const category of roots) {
    const branch = await categoryBranchSlugs(category.slug);
    const inBranch = all.filter((p) => branch.has(p.categoryId));
    const withPhoto = inBranch.find((p) => p.images[0]?.url);
    if (inBranch.length === 0 || !withPhoto) continue;
    const url = withPhoto.images[0].url;
    slides.push({
      slug: category.slug,
      title: HERO_TITLES[category.slug] ?? category.name,
      name: category.name,
      image: { url, alt: category.name, width: 1600, height: 1000 },
      count: inBranch.length,
    });
  }
  return slides;
}

export type { ProductFeature };
