import { z } from 'zod';
import type { CatalogQuery, ProductFeature, SortKey } from '@/types';

/**
 * Разбор и сборка состояния каталога.
 *
 * Всё состояние фильтров живёт в URL (п.20 ТЗ), поэтому здесь единственное место,
 * где строка запроса превращается в объект и обратно. Back/Forward и обновление
 * страницы работают только потому, что никакого другого хранилища у фильтров нет.
 */

export const SORT_KEYS = ['popular', 'new', 'price_asc', 'price_desc', 'name'] as const;

export const sortLabels: Record<SortKey, string> = {
  popular: 'По популярности',
  new: 'Сначала новые',
  price_asc: 'Сначала дешевле',
  price_desc: 'Сначала дороже',
  name: 'По названию',
};

export const DEFAULT_SORT: SortKey = 'popular';
export const DEFAULT_PER_PAGE = 24;
export const MAX_PER_PAGE = 60;

const FEATURES = ['uv', 'phantom', 'inclusion', 'habit', 'twin'] as const;

/** Значение может прийти как строка или как массив (?mineral=a&mineral=b) */
function toList(value: string | string[] | undefined | null): string[] | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const items = raw
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  return items.length ? Array.from(new Set(items)) : undefined;
}

const numberish = z.coerce.number().finite().nonnegative().optional().catch(undefined);

export const catalogQuerySchema = z.object({
  mineral: z.array(z.string()).optional(),
  deposit: z.array(z.string()).optional(),
  country: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  feature: z.array(z.enum(FEATURES)).optional(),
  priceFrom: numberish,
  priceTo: numberish,
  sizeFrom: numberish,
  sizeTo: numberish,
  weightFrom: numberish,
  weightTo: numberish,
  inStock: z.boolean().optional(),
  isNew: z.boolean().optional(),
  onSale: z.boolean().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
  perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).optional().catch(undefined),
});

export type SearchParamsInput = Record<string, string | string[] | undefined>;

/** URLSearchParams / searchParams страницы → CatalogQuery */
export function parseCatalogQuery(input: SearchParamsInput | URLSearchParams): CatalogQuery {
  const get = (key: string): string | string[] | undefined => {
    if (input instanceof URLSearchParams) {
      const all = input.getAll(key);
      return all.length === 0 ? undefined : all.length === 1 ? all[0] : all;
    }
    return input[key];
  };
  const flag = (key: string): boolean | undefined => {
    const v = get(key);
    const s = Array.isArray(v) ? v[0] : v;
    if (s === undefined) return undefined;
    return s === '1' || s === 'true';
  };
  const single = (key: string): string | undefined => {
    const v = get(key);
    return Array.isArray(v) ? v[0] : v;
  };

  const parsed = catalogQuerySchema.safeParse({
    mineral: toList(get('mineral')),
    deposit: toList(get('deposit')),
    country: toList(get('country')),
    region: toList(get('region')),
    color: toList(get('color')),
    feature: toList(get('feature'))?.filter((f): f is ProductFeature =>
      (FEATURES as readonly string[]).includes(f),
    ),
    priceFrom: single('priceFrom'),
    priceTo: single('priceTo'),
    sizeFrom: single('sizeFrom'),
    sizeTo: single('sizeTo'),
    weightFrom: single('weightFrom'),
    weightTo: single('weightTo'),
    inStock: flag('inStock'),
    isNew: flag('isNew'),
    onSale: flag('onSale'),
    q: single('q'),
    sort: single('sort'),
    page: single('page'),
    perPage: single('perPage'),
  });

  // Кривые параметры не должны ронять страницу — просто игнорируем их
  return parsed.success ? parsed.data : {};
}

/** CatalogQuery → строка запроса. Пустые и дефолтные значения не пишем — URL остаётся коротким. */
export function buildSearchParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  const addList = (key: string, values?: string[]) => {
    if (values?.length) params.set(key, values.join(','));
  };
  addList('mineral', query.mineral);
  addList('deposit', query.deposit);
  addList('country', query.country);
  addList('region', query.region);
  addList('color', query.color);
  addList('feature', query.feature);

  const addNum = (key: string, value?: number) => {
    if (typeof value === 'number' && Number.isFinite(value)) params.set(key, String(value));
  };
  addNum('priceFrom', query.priceFrom);
  addNum('priceTo', query.priceTo);
  addNum('sizeFrom', query.sizeFrom);
  addNum('sizeTo', query.sizeTo);
  addNum('weightFrom', query.weightFrom);
  addNum('weightTo', query.weightTo);

  if (query.inStock) params.set('inStock', '1');
  if (query.isNew) params.set('isNew', '1');
  if (query.onSale) params.set('onSale', '1');
  if (query.q) params.set('q', query.q);
  if (query.sort && query.sort !== DEFAULT_SORT) params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.perPage && query.perPage !== DEFAULT_PER_PAGE) params.set('perPage', String(query.perPage));

  return params;
}

export function buildCatalogHref(pathname: string, query: CatalogQuery): string {
  const params = buildSearchParams(query);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Есть ли хоть один активный фильтр (сортировка и страница фильтрами не считаются) */
export function hasActiveFilters(query: CatalogQuery): boolean {
  return Boolean(
    query.mineral?.length ||
      query.deposit?.length ||
      query.country?.length ||
      query.region?.length ||
      query.color?.length ||
      query.feature?.length ||
      query.priceFrom ||
      query.priceTo ||
      query.sizeFrom ||
      query.sizeTo ||
      query.weightFrom ||
      query.weightTo ||
      query.inStock ||
      query.isNew ||
      query.onSale,
  );
}

/** Сбросить фильтры, сохранив поисковый запрос и сортировку */
export function clearedFilters(query: CatalogQuery): CatalogQuery {
  return { q: query.q, sort: query.sort, perPage: query.perPage };
}

/** Переключить значение в множественном фильтре; любое изменение возвращает на 1-ю страницу */
export function toggleListValue(
  query: CatalogQuery,
  key: 'mineral' | 'deposit' | 'country' | 'region' | 'color' | 'feature',
  value: string,
): CatalogQuery {
  const current = (query[key] as string[] | undefined) ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return { ...query, [key]: next.length ? next : undefined, page: undefined };
}
