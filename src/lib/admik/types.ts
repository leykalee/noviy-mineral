/**
 * Типы Storefront API Admik (подмножество, нужное витрине «Новый Минерал»).
 *
 * Источник правды по DTO бэкенда: `admik/lib/storefront/dto.ts`, `order-dto.ts`,
 * `settings-dto.ts`. Здесь — только то, что витрина реально потребляет.
 *
 * Деньги приходят строками NUMERIC (₽) — точность не теряется; наличие — булевым
 * `inStock` (точный остаток бэкенд не раскрывает). Витринная вью-модель — это
 * собственный тип магазина `@/types` (`Product`, `Category`), маппинг — adapter.ts.
 *
 * См. docs Admik: 13-сращивание-the-case.md (§3 контракт данных).
 */

// ---------------------------------------------------------------------------
// Каталог: бренд / медиа / вариант / товар / категория.
// ---------------------------------------------------------------------------

export interface AdmikBrandDto {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface AdmikMediaDto {
  url: string | null;
  type: string;
  alt: string;
  isPrimary: boolean;
  /** Вариант, к которому привязано фото; null — общее фото товара. */
  variantId?: string | null;
}

export interface AdmikVariantDto {
  id: string;
  sku: string;
  /** Человекочитаемое имя варианта; '' если не задано. */
  name: string;
  /** Эффективная цена варианта — строка NUMERIC (₽). */
  price: string;
  compareAtPrice: string | null;
  discountPct: number | null;
  onSale: boolean;
  /** Денормализованные атрибуты варианта. */
  attributes: Record<string, unknown>;
  color?: string | null;
  colorHex?: string | null;
  inStock: boolean;
  /** Доступно к заказу (quantity − reserved, ≥0). */
  availableQty: number;
}

export interface AdmikProductListItemDto {
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  discountPct: number | null;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  brand: AdmikBrandDto | null;
  imageUrl: string | null;
  inStock: boolean;
  availableQty: number;
  /** Фасетные поля (опциональны для обратной совместимости). */
  gender?: string;
  color?: string;
  sizes?: string[];
}

export interface AdmikSeoMeta {
  title: string;
  description: string | null;
  canonical: string | null;
  ogTitle: string;
  ogDescription: string | null;
  ogImageUrl: string | null;
  noindex: boolean;
}

export interface AdmikProductDetailDto {
  /** uuid товара — нужен для заказа товара БЕЗ вариантов (productId в quote/order). */
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string | null;
  discountPct: number | null;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  brand: AdmikBrandDto | null;
  categories: string[];
  attributes: Record<string, unknown>;
  colors?: { value: string; hex?: string | null }[];
  variants: AdmikVariantDto[];
  media: AdmikMediaDto[];
  inStock: boolean;
  availableQty: number;
  meta: AdmikSeoMeta;
}

export interface AdmikCategoryDto {
  slug: string;
  name: string;
  description: string;
  children: AdmikCategoryDto[];
}

// ---------------------------------------------------------------------------
// Заказы / расчёт корзины (POST /cart/quote, /orders, GET /orders/:number).
// ---------------------------------------------------------------------------

export type AdmikDeliveryType = 'courier' | 'pvz' | 'pickup';

export type AdmikPaymentMethod =
  | 'unset'
  | 'cod'
  | 'card'
  | 'sbp'
  | 'cdek_pay'
  | 'invoice';

export interface AdmikCartLineInput {
  variantId?: string;
  productId?: string;
  qty: number;
  weightG?: number;
}

export interface AdmikDeliverySelection {
  type: AdmikDeliveryType;
  city?: string;
  cityCode?: number;
  country?: string;
  address?: string;
  pvzCode?: string;
}

export interface AdmikQuoteInput {
  items: AdmikCartLineInput[];
  promoCode?: string;
  delivery?: AdmikDeliverySelection;
}

export interface AdmikCreateOrderInput {
  items: AdmikCartLineInput[];
  customer: { name: string; email: string; phone: string };
  delivery: AdmikDeliverySelection;
  paymentMethod: AdmikPaymentMethod;
  promoCode?: string;
  comment?: string;
  giftWrap?: boolean;
}

export interface AdmikQuoteLineDto {
  name: string;
  sku: string;
  unitPrice: string;
  compareAtPrice: string | null;
  qty: number;
  lineTotal: string;
  isGift: boolean;
}

export interface AdmikQuoteDto {
  itemsTotal: string;
  discountTotal: string;
  deliveryTotal: string;
  grandTotal: string;
  currency: string;
  lines: AdmikQuoteLineDto[];
  promo: { applied: boolean; code: string | null; discount: string; reason: string | null };
  delivery: {
    free: boolean;
    freeThresholdMet: boolean;
    cost: string;
    available?: boolean;
  };
  fulfillable: boolean;
  issues: Array<{ index: number; code: string }>;
}

export interface AdmikOrderCreatedDto {
  number: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  currency: string;
  accessToken: string;
}

export interface AdmikOrderItemDto {
  name: string;
  sku: string;
  attributes: Record<string, unknown>;
  unitPrice: string;
  compareAtPrice: string | null;
  qty: number;
  lineTotal: string;
  isGift: boolean;
}

export interface AdmikOrderPublicDto {
  number: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  statusLabel: string;
  paymentStatusLabel: string;
  deliveryStatusLabel: string;
  itemsTotal: string;
  discountTotal: string;
  deliveryTotal: string;
  grandTotal: string;
  currency: string;
  promoCode: string | null;
  paymentMethod: string;
  delivery: {
    type: string;
    city: string | null;
    track: string | null;
  };
  items: AdmikOrderItemDto[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// СДЭК (delivery/cdek/*).
// ---------------------------------------------------------------------------

export interface AdmikCdekCityDto {
  code: number;
  name: string;
  region: string;
  country?: string;
}

export interface AdmikCdekPvzDto {
  code: string;
  name: string;
  address: string;
  type: string;
  location: { latitude: number; longitude: number } | null;
  workTime: string;
}

export interface AdmikCdekCalcDto {
  tariffCode: number;
  cost: number;
  etaDays: number;
  periodMin: number;
  periodMax: number;
}

// ---------------------------------------------------------------------------
// Настройки магазина (GET /settings → PublicSettingsDto). ADR-018 / G-01.
// ---------------------------------------------------------------------------

export interface AdmikSocialDto {
  type: string;
  url: string;
}

export interface AdmikHomeDto {
  hero: {
    title: string | null;
    subtitle: string | null;
    imageUrl: string | null;
    ctaLabel: string | null;
    ctaHref: string | null;
  };
  about: {
    title: string;
    paragraphs: string[];
    imageUrls: string[];
    values: string[];
  };
  quality: { title: string; items: string[] };
  delivery: { items: { title: string; text: string }[] };
  valuesStrip: { enabled: boolean; items: { title: string; text: string }[] };
  philosophy: {
    eyebrow: string;
    title: string;
    text: string;
    linkLabel: string;
    linkHref: string;
  };
}

export interface AdmikSettingsDto {
  branding: {
    shopName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    theme: {
      primaryColor: string | null;
      accentColor: string | null;
      mode: 'light' | 'dark' | 'system';
    };
    supportEmail: string | null;
    supportPhone: string | null;
  };
  currency: {
    code: string;
    symbol: string | null;
    locale: string | null;
    fractionDigits: number;
  };
  units: { weight: 'g' | 'kg'; dimension: 'cm' | 'mm'; system: 'metric' };
  contacts: {
    phone: string | null;
    email: string | null;
    address: string | null;
    workingHours: string | null;
    socials: AdmikSocialDto[];
  };
  legalEntity: {
    name: string | null;
    inn: string | null;
    kpp: string | null;
    ogrn: string | null;
    legalAddress: string | null;
  };
  delivery: { freeDeliveryThreshold: number };
  checkout?: {
    onlinePaymentEnabled?: boolean | null;
    paymentDisabledNotice?: string | null;
    giftWrapEnabled?: boolean | null;
    giftWrapLabel?: string | null;
  } | null;
  seo: {
    siteName: string | null;
    siteUrl: string | null;
    titleTemplate: string;
    defaultDescription: string | null;
    twitterSite: string | null;
    noindex?: boolean | null;
  };
  home: AdmikHomeDto;
  navigation: {
    header: { label: string; href: string }[];
    footer: { title: string; links: { label: string; href: string }[] }[];
  };
}

// ---------------------------------------------------------------------------
// CMS-страницы (GET /pages, /pages/[slug]).
// ---------------------------------------------------------------------------

export type AdmikSectionType =
  | 'hero'
  | 'text'
  | 'banner'
  | 'products_grid'
  | 'faq'
  | 'cta'
  | 'gallery';

export interface AdmikSectionDto {
  type: AdmikSectionType;
  content: Record<string, unknown>;
}

export interface AdmikSeoMetaDto {
  title: string;
  description: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}

export interface AdmikPageDto {
  slug: string;
  title: string;
  meta: AdmikSeoMetaDto;
  sections: AdmikSectionDto[];
}

export interface AdmikPageListItemDto {
  slug: string;
  title: string;
  meta: AdmikSeoMetaDto;
}
