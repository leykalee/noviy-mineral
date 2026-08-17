import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Схема PostgreSQL (п.59 ТЗ). ORM — только Drizzle, второй не ставим.
 *
 * Схема описывает ту же предметную модель, что и src/types: категория,
 * минеральный вид и месторождение — отдельные сущности, а не строки описания,
 * иначе по ним нельзя фильтровать (п.47 ТЗ).
 *
 * Пока приложение работает на demo-данных; переключение — в src/lib/repository.ts.
 */

export const productStatus = pgEnum('product_status', ['available', 'reserved', 'sold_out']);
export const productKind = pgEnum('product_kind', ['mineral', 'craft', 'jewelry', 'book', 'accessory']);
export const orderStatus = pgEnum('order_status', [
  'new',
  'awaiting_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'authorized',
  'paid',
  'failed',
  'refunded',
]);
export const promoKind = pgEnum('promo_kind', ['percent', 'fixed']);

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    parentId: text('parent_id'),
    imageUrl: text('image_url'),
    menuGroup: text('menu_group'),
    order: integer('order').notNull().default(0),
  },
  (table) => [uniqueIndex('categories_slug_idx').on(table.slug)],
);

export const minerals = pgTable(
  'minerals',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    formula: text('formula'),
    about: text('about'),
    imageUrl: text('image_url'),
    isPopular: boolean('is_popular').notNull().default(false),
  },
  (table) => [uniqueIndex('minerals_slug_idx').on(table.slug)],
);

export const deposits = pgTable(
  'deposits',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    country: text('country').notNull(),
    region: text('region'),
    about: text('about'),
  },
  (table) => [uniqueIndex('deposits_slug_idx').on(table.slug)],
);

export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    kind: productKind('kind').notNull(),

    shortDescription: text('short_description'),
    description: text('description'),

    /** Цены в копейках не нужны: рублёвый прайс без копеек */
    price: integer('price').notNull(),
    oldPrice: integer('old_price'),

    stock: integer('stock').notNull().default(0),
    uniquePiece: boolean('unique_piece').notNull().default(false),
    status: productStatus('status').notNull().default('available'),

    mineralId: text('mineral_id').references(() => minerals.id),
    depositId: text('deposit_id').references(() => deposits.id),

    country: text('country'),
    region: text('region'),

    /** Габариты в мм, вес в граммах */
    width: integer('width'),
    height: integer('height'),
    depth: integer('depth'),
    weight: integer('weight'),

    /** Значения фильтров хранятся массивами, а не строкой описания */
    colors: text('colors').array(),
    features: text('features').array(),
    material: text('material'),

    isNew: boolean('is_new').notNull().default(false),
    isFeatured: boolean('is_featured').notNull().default(false),
    popularity: integer('popularity').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('products_slug_idx').on(table.slug),
    uniqueIndex('products_sku_idx').on(table.sku),
    // индексы под самые частые фильтры каталога на 2000+ SKU
    index('products_category_idx').on(table.categoryId),
    index('products_mineral_idx').on(table.mineralId),
    index('products_deposit_idx').on(table.depositId),
    index('products_price_idx').on(table.price),
    index('products_status_idx').on(table.status),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt').notNull().default(''),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [index('product_images_product_idx').on(table.productId)],
);

/** Произвольные характеристики, которых нет в фиксированных колонках */
export const productAttributes = pgTable(
  'product_attributes',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    value: text('value').notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.name] })],
);

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.productId] })],
);

export const carts = pgTable('carts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  /** Для гостей — идентификатор из cookie */
  guestToken: text('guest_token'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  'cart_items',
  {
    cartId: text('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.cartId, table.productId] })],
);

export const promoCodes = pgTable(
  'promo_codes',
  {
    code: text('code').primaryKey(),
    kind: promoKind('kind').notNull(),
    value: integer('value').notNull(),
    minSubtotal: integer('min_subtotal'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    disabled: boolean('disabled').notNull().default(false),
  },
);

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  city: text('city').notNull(),
  street: text('street'),
  postalCode: text('postal_code'),
  pickupPointCode: text('pickup_point_code'),
  pickupPointAddress: text('pickup_point_address'),
});

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    number: text('number').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

    /** Две независимые шкалы: состояние заказа и состояние платежа */
    status: orderStatus('status').notNull().default('new'),
    paymentStatus: paymentStatus('payment_status').notNull().default('pending'),

    subtotal: integer('subtotal').notNull(),
    discount: integer('discount').notNull().default(0),
    promoCode: text('promo_code'),
    /** null — доставка ещё не рассчитана */
    deliveryPrice: integer('delivery_price'),
    total: integer('total').notNull(),

    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email').notNull(),

    deliveryMethodId: text('delivery_method_id').notNull(),
    deliveryMethodName: text('delivery_method_name').notNull(),
    address: jsonb('address').notNull(),

    paymentMethodId: text('payment_method_id').notNull(),
    paymentMethodName: text('payment_method_name').notNull(),

    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('orders_number_idx').on(table.number),
    index('orders_user_idx').on(table.userId),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull(),
    /** Название, артикул и цена копируются в момент заказа: прайс потом меняется */
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    imageUrl: text('image_url'),
    price: integer('price').notNull(),
    quantity: integer('quantity').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.productId] })],
);

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    externalId: text('external_id'),
    amount: integer('amount').notNull(),
    status: paymentStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payments_order_idx').on(table.orderId)],
);

export const shipments = pgTable(
  'shipments',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('shipments_order_idx').on(table.orderId)],
);
