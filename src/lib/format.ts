import type { ProductStatus } from '@/types';

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'decimal',
  maximumFractionDigits: 0,
});

/** 2800 → «2 800 ₽» */
export function formatPrice(value: number): string {
  return `${priceFormatter.format(Math.round(value))} ₽`;
}

/** 2800 → «2 800» (без знака валюты — когда ₽ рисуется отдельно) */
export function formatNumber(value: number): string {
  return priceFormatter.format(Math.round(value));
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** Габариты в мм → «96 × 64 × 58 мм»; пропущенные размеры не показываем */
export function formatDimensions(w?: number, h?: number, d?: number): string | null {
  const parts = [w, h, d].filter((v): v is number => typeof v === 'number' && v > 0);
  if (parts.length === 0) return null;
  return `${parts.join(' × ')} мм`;
}

/** 412 → «412 г», 1250 → «1,25 кг» */
export function formatWeight(grams?: number): string | null {
  if (!grams || grams <= 0) return null;
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} кг`;
  }
  return `${grams} г`;
}

export const statusLabels: Record<ProductStatus, string> = {
  available: 'В наличии',
  reserved: 'Зарезервирован',
  sold_out: 'Продан',
};

/** Можно ли положить товар в корзину */
export function isPurchasable(status: ProductStatus, stock: number): boolean {
  return status === 'available' && stock > 0;
}

/** Скидка в процентах, если есть старая цена */
export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** «1 товар / 2 товара / 5 товаров» */
export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function productsCountLabel(count: number): string {
  return `${formatNumber(count)} ${pluralize(count, 'товар', 'товара', 'товаров')}`;
}
