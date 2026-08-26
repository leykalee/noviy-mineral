/**
 * Чистые мапперы: DTO каталога Admik → предметная модель витрины «Новый Минерал»
 * (`@/types`: Product, Category). Без сети/Next — тестируются юнит-тестами.
 *
 * Специфика минералов (минеральный вид, месторождение, габариты, признаки) в
 * канонической модели Admik отсутствует и задаётся владельцем в АТРИБУТАХ товара
 * (EAV). Адаптер читает их с фолбэками латиница/кириллица и регистронезависимо.
 * Контракт ключей документируется владельцу — см. README раздел «Атрибуты Admik».
 */

import type {
  Category,
  Product,
  ProductFeature,
  ProductImage,
  ProductKind,
  ProductStatus,
} from '@/types';
import type {
  AdmikCategoryDto,
  AdmikProductDetailDto,
  AdmikProductListItemDto,
} from './types';

// ---------------------------------------------------------------------------
// Деньги: строка NUMERIC (₽) → number. Невалидное/пустое → 0.
// ---------------------------------------------------------------------------

export function parseMoney(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** compareAtPrice → oldPrice: число > 0 или undefined. */
function parseOldPrice(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// ---------------------------------------------------------------------------
// Атрибуты (EAV): чтение по списку ключей-кандидатов, регистронезависимо.
// ---------------------------------------------------------------------------

export function readAttr(
  attrs: Record<string, unknown> | null | undefined,
  keys: string[],
): unknown {
  if (!attrs) return undefined;
  const lower = new Map<string, unknown>();
  for (const [k, v] of Object.entries(attrs)) {
    lower.set(k.toLowerCase().trim(), v);
  }
  for (const key of keys) {
    const v = lower.get(key.toLowerCase().trim());
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (!empty) return v;
  }
  return undefined;
}

export function readAttrString(
  attrs: Record<string, unknown> | null | undefined,
  keys: string[],
  def = '',
): string {
  const v = readAttr(attrs, keys);
  if (v === undefined) return def;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(', ');
  return String(v).trim();
}

/** Атрибут → число (мм, г, ₽…). Возвращает undefined для нечисловых/пустых. */
export function readAttrNumber(
  attrs: Record<string, unknown> | null | undefined,
  keys: string[],
): number | undefined {
  const v = readAttr(attrs, keys);
  if (v === undefined) return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Атрибут → boolean. Понимает true/1/да/yes/есть. */
export function readAttrBool(
  attrs: Record<string, unknown> | null | undefined,
  keys: string[],
): boolean | undefined {
  const v = readAttr(attrs, keys);
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (/^(true|1|да|yes|есть|y)$/.test(s)) return true;
  if (/^(false|0|нет|no|n)$/.test(s)) return false;
  return undefined;
}

/** Список строк из атрибута-массива или строки с разделителями (`;` `\n` `,`). */
export function readAttrList(
  attrs: Record<string, unknown> | null | undefined,
  keys: string[],
): string[] {
  const v = readAttr(attrs, keys);
  if (v === undefined) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v)
    .split(/[;\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Слуг из произвольной строки (для синтетических mineralId/depositId).
// ---------------------------------------------------------------------------

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(input: string): string {
  const lower = input.toLowerCase().trim();
  let out = '';
  for (const ch of lower) out += TRANSLIT[ch] ?? ch;
  return out
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Тип товара (kind): из атрибута, иначе из slug-ов категорий, иначе 'mineral'.
// ---------------------------------------------------------------------------

const KIND_RULES: Array<[ProductKind, RegExp]> = [
  ['jewelry', /(jewelry|jewellery|украшен|серьг|кольц|кулон|подвес|бусы|браслет)/],
  ['book', /(book|книг|литератур)/],
  ['craft', /(craft|издели|фигур|шар|пирамид|срез|подсвечник|часы|камен)/],
  ['accessory', /(accessory|accessories|сопутств|аксессуар|подставк|коробк)/],
  ['mineral', /(mineral|минерал|образец|кристалл|друз|штуф|коллекц)/],
];

export function resolveKind(
  attrs: Record<string, unknown> | null | undefined,
  categorySlugs: string[] = [],
): ProductKind {
  const explicit = readAttrString(attrs, ['kind', 'тип', 'тип товара', 'type']).toLowerCase();
  const hay = `${explicit} ${categorySlugs.join(' ')}`.toLowerCase();
  for (const [kind, re] of KIND_RULES) {
    if (re.test(hay)) return kind;
  }
  return 'mineral';
}

// ---------------------------------------------------------------------------
// Признаки экземпляра (ProductFeature) из атрибута «особенности».
// ---------------------------------------------------------------------------

const FEATURE_RULES: Array<[ProductFeature, RegExp]> = [
  ['uv', /(uv|уф|флуоресц|светит|люминесц)/],
  ['phantom', /(phantom|фантом|зональн)/],
  ['inclusion', /(inclusion|включени)/],
  ['habit', /(habit|габитус|форм)/],
  ['twin', /(twin|двойник)/],
];

export function resolveFeatures(
  attrs: Record<string, unknown> | null | undefined,
): ProductFeature[] {
  const raw = readAttrList(attrs, ['features', 'особенности', 'признаки']);
  const out = new Set<ProductFeature>();
  for (const token of raw) {
    for (const [feature, re] of FEATURE_RULES) {
      if (re.test(token.toLowerCase())) out.add(feature);
    }
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Медиа Admik → ProductImage[]. Габаритов у медиа нет — ставим дефолт (карточки
// используют относительные размеры/fill; точные пиксели тут некритичны).
// ---------------------------------------------------------------------------

const DEFAULT_IMG_W = 1200;
const DEFAULT_IMG_H = 1200;

function toImages(
  media: AdmikProductDetailDto['media'],
  fallbackAlt: string,
): ProductImage[] {
  return media
    .filter((m): m is typeof m & { url: string } => Boolean(m.url))
    .map((m) => ({
      url: m.url,
      alt: m.alt || fallbackAlt,
      width: DEFAULT_IMG_W,
      height: DEFAULT_IMG_H,
    }));
}

// ---------------------------------------------------------------------------
// Статус товара из наличия (reserved от sold_out по API неотличим).
// ---------------------------------------------------------------------------

function statusFromStock(inStock: boolean): ProductStatus {
  return inStock ? 'available' : 'sold_out';
}

// ---------------------------------------------------------------------------
// Списочный товар (карточка каталога): list-DTO → Product.
// В списке нет атрибутов/категорий/вариантов — заполняем безопасными дефолтами.
// ---------------------------------------------------------------------------

export function fromListItem(dto: AdmikProductListItemDto): Product {
  const price = parseMoney(dto.price);
  const image: ProductImage | undefined = dto.imageUrl
    ? { url: dto.imageUrl, alt: dto.name, width: DEFAULT_IMG_W, height: DEFAULT_IMG_H }
    : undefined;
  const colors = (dto.color ?? '').trim() ? [(dto.color as string).trim()] : undefined;
  return {
    id: dto.slug, // в списке uuid не приходит; slug — стабильный ключ карточки
    slug: dto.slug,
    sku: '',
    name: dto.name,
    categoryId: '',
    kind: 'mineral',
    price,
    oldPrice: parseOldPrice(dto.compareAtPrice),
    stock: Math.max(0, Math.trunc(dto.availableQty ?? 0)),
    uniquePiece: (dto.availableQty ?? 0) <= 1,
    status: statusFromStock(dto.inStock),
    images: image ? [image] : [],
    colors,
    isNew: dto.isNew,
    isFeatured: dto.isFeatured,
    popularity: 0,
    createdAt: '',
    updatedAt: '',
  };
}

// ---------------------------------------------------------------------------
// Полная карточка: detail-DTO → Product (атрибуты минералов из EAV).
// ---------------------------------------------------------------------------

export function fromDetail(dto: AdmikProductDetailDto): Product {
  const a = dto.attributes;
  const categorySlugs = dto.categories ?? [];

  const mineralName = readAttrString(a, ['mineral', 'минерал', 'вид', 'минеральный вид']);
  const depositName = readAttrString(a, ['deposit', 'месторождение']);

  const colorsList = readAttrList(a, ['color', 'colors', 'цвет', 'цвета']);
  const dtoColors = (dto.colors ?? []).map((c) => c.value).filter(Boolean);
  const colors = [...new Set([...colorsList, ...dtoColors])];

  const price = parseMoney(dto.price);
  const availableQty = Math.max(0, Math.trunc(dto.availableQty ?? 0));

  return {
    id: dto.id,
    slug: dto.slug,
    sku: dto.sku,
    name: dto.name,
    categoryId: categorySlugs[0] ?? '',
    kind: resolveKind(a, categorySlugs),

    shortDescription: readAttrString(a, ['shortDescription', 'краткое', 'краткое описание']) || undefined,
    description: dto.description || undefined,

    price,
    oldPrice: parseOldPrice(dto.compareAtPrice),

    stock: availableQty,
    uniquePiece: readAttrBool(a, ['unique', 'уникальный', 'единственный']) ?? availableQty <= 1,
    status: statusFromStock(dto.inStock),

    images: toImages(dto.media, dto.name),

    mineralId: mineralName ? slugify(mineralName) : undefined,
    depositId: depositName ? slugify(depositName) : undefined,
    mineralName: mineralName || undefined,
    depositName: depositName || undefined,

    country: readAttrString(a, ['country', 'страна']) || undefined,
    region: readAttrString(a, ['region', 'регион']) || undefined,

    width: readAttrNumber(a, ['width', 'ширина']),
    height: readAttrNumber(a, ['height', 'высота']),
    depth: readAttrNumber(a, ['depth', 'глубина', 'толщина']),
    weight: readAttrNumber(a, ['weight', 'вес', 'масса']),

    colors: colors.length ? colors : undefined,
    features: resolveFeatures(a),
    material: readAttrString(a, ['material', 'материал']) || undefined,

    isNew: dto.isNew,
    isFeatured: dto.isFeatured,
    popularity: readAttrNumber(a, ['popularity', 'популярность']) ?? 0,

    createdAt: '',
    updatedAt: '',
  };
}

// ---------------------------------------------------------------------------
// Категории: дерево Admik → плоский список Category витрины (data-driven меню).
// ---------------------------------------------------------------------------

const MENU_GROUP_RULES: Array<[NonNullable<Category['menuGroup']>, RegExp]> = [
  ['jewelry', /(украшен|jewelry|jewellery)/],
  ['crafts', /(издели|craft|камен|сувенир)/],
  ['collectors', /(коллекц|collector|образц)/],
  ['minerals', /(минерал|mineral|кристалл)/],
];

function resolveMenuGroup(slug: string, name: string): Category['menuGroup'] {
  const hay = `${slug} ${name}`.toLowerCase();
  for (const [group, re] of MENU_GROUP_RULES) {
    if (re.test(hay)) return group;
  }
  return 'other';
}

/** Разворачивает дерево категорий Admik в плоский список Category (с parentId/order). */
export function flattenCategories(tree: AdmikCategoryDto[]): Category[] {
  const out: Category[] = [];
  const walk = (nodes: AdmikCategoryDto[], parentId?: string) => {
    nodes.forEach((node, index) => {
      out.push({
        id: node.slug,
        slug: node.slug,
        name: node.name,
        description: node.description || undefined,
        parentId,
        order: index,
        menuGroup: resolveMenuGroup(node.slug, node.name),
      });
      if (node.children?.length) walk(node.children, node.slug);
    });
  };
  walk(tree);
  return out;
}
