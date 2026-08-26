/**
 * Предметная модель магазина коллекционных минералов.
 *
 * Ключевая идея (см. docs/research.md §5.2): покупается не абстрактный «аметист»,
 * а конкретный физический экземпляр со своим артикулом, размерами и статусом.
 */

export type ProductStatus = 'available' | 'reserved' | 'sold_out';

export type ProductKind =
  | 'mineral' // коллекционный образец, обычно уникальный
  | 'craft' // изделие из камня
  | 'jewelry' // украшение
  | 'book' // книга
  | 'accessory'; // сопутствующий товар

export interface ProductImage {
  /** Путь относительно /public */
  url: string;
  alt: string;
  width: number;
  height: number;
  /** Изображение-заглушка из demo-набора; подлежит замене на фото заказчика */
  isPlaceholder?: boolean;
}

/** Поперечный признак экземпляра — то, что коллекционер ищет отдельно от вида. */
export type ProductFeature =
  | 'uv' // светится в УФ
  | 'phantom' // фантомы, зональность
  | 'inclusion' // включения
  | 'habit' // необычный габитус
  | 'twin'; // двойники

export interface Product {
  id: string;
  slug: string;
  sku: string;

  name: string;
  categoryId: string;
  kind: ProductKind;

  shortDescription?: string;
  description?: string;

  price: number;
  oldPrice?: number;

  stock: number;
  /** true → это единственный физический экземпляр, stock всегда 1 */
  uniquePiece: boolean;

  status: ProductStatus;

  images: ProductImage[];

  mineralId?: string;
  depositId?: string;
  /** Отображаемое имя минерального вида (из атрибутов Admik; справочника нет) */
  mineralName?: string;
  /** Отображаемое имя месторождения (из атрибутов Admik) */
  depositName?: string;

  country?: string;
  region?: string;

  /** Габариты экземпляра, мм */
  width?: number;
  height?: number;
  depth?: number;
  /** Вес, г */
  weight?: number;

  /** Основной визуальный цвет — фильтр для новичка, который не знает названий */
  colors?: string[];
  features?: ProductFeature[];

  /** Материал для изделий и украшений */
  material?: string;

  isNew: boolean;
  isFeatured: boolean;
  /** Счётчик просмотров, используется для сортировки «по популярности» */
  popularity: number;

  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Короткое описание под H1 */
  description?: string;
  parentId?: string;
  /** Картинка для визуальной плитки на главной */
  image?: ProductImage;
  /** Порядок в меню */
  order: number;
  /** Показывать в mega-menu в этой группе */
  menuGroup?: 'minerals' | 'crafts' | 'jewelry' | 'collectors' | 'other';
}

/** Минеральный вид — справочная сущность, ось навигации №2 */
export interface Mineral {
  id: string;
  slug: string;
  name: string;
  /** Химическая формула, если известна */
  formula?: string;
  /** Справка о виде — не о конкретном экземпляре */
  about?: string;
  image?: ProductImage;
  isPopular: boolean;
}

/** Месторождение — ось навигации №3 */
export interface Deposit {
  id: string;
  slug: string;
  name: string;
  country: string;
  region?: string;
  about?: string;
}

export interface Color {
  id: string;
  name: string;
  /** Для образца-кружка в фильтре */
  hex: string;
}

// --- Корзина, избранное ---

export interface CartItem {
  productId: string;
  quantity: number;
  /** Момент добавления — для стабильного порядка строк */
  addedAt: number;
}

export interface FavoriteItem {
  productId: string;
  addedAt: number;
}

// --- Промокоды ---

export type PromoKind = 'percent' | 'fixed';

export interface PromoCode {
  code: string;
  kind: PromoKind;
  /** Проценты (1–100) либо рубли */
  value: number;
  /** Минимальная сумма заказа, руб. */
  minSubtotal?: number;
  /** ISO-дата окончания; отсутствует → бессрочный */
  expiresAt?: string;
  /** Промокод отключён администратором */
  disabled?: boolean;
}

export type PromoErrorCode =
  | 'not_found'
  | 'expired'
  | 'min_subtotal'
  | 'already_applied'
  | 'disabled';

export interface PromoApplied {
  code: string;
  /** Сумма скидки в рублях */
  discount: number;
}

// --- Заказы ---

export type OrderStatus =
  | 'new'
  | 'awaiting_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/** Статус оплаты сознательно отделён от статуса заказа (п.43 ТЗ) */
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export interface Address {
  city: string;
  /** Адрес доставки курьером */
  street?: string;
  /** Код ПВЗ, если выбран пункт выдачи */
  pickupPointCode?: string;
  pickupPointAddress?: string;
  postalCode?: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  image?: ProductImage;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  /** Человекочитаемый номер, например НМ-100241 */
  number: string;
  createdAt: string;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  items: OrderItem[];

  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryPrice: number | null;
  total: number;

  customer: {
    name: string;
    phone: string;
    email: string;
  };

  deliveryMethodId: string;
  deliveryMethodName: string;
  address: Address;

  paymentMethodId: string;
  paymentMethodName: string;

  comment?: string;

  /** Номер накладной у службы доставки, когда отгружено */
  trackingNumber?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

// --- Каталог: запрос и ответ ---

export type SortKey = 'popular' | 'new' | 'price_asc' | 'price_desc' | 'name';

export interface CatalogQuery {
  category?: string;
  mineral?: string[];
  deposit?: string[];
  country?: string[];
  region?: string[];
  color?: string[];
  feature?: ProductFeature[];
  priceFrom?: number;
  priceTo?: number;
  sizeFrom?: number;
  sizeTo?: number;
  weightFrom?: number;
  weightTo?: number;
  inStock?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  q?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  /** Для цветового фильтра */
  hex?: string;
}

export interface CatalogFacets {
  mineral: FacetValue[];
  country: FacetValue[];
  region: FacetValue[];
  deposit: FacetValue[];
  color: FacetValue[];
  feature: FacetValue[];
  priceMin: number;
  priceMax: number;
}

export interface CatalogResult {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  facets: CatalogFacets;
}
