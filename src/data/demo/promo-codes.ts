import type { PromoCode } from '@/types';

/**
 * ДЕМОНСТРАЦИОННЫЕ промокоды.
 *
 * ⚠️ Заказчик реальных промокодов не передавал. Эти коды нужны, чтобы показать
 * работу механики и все её состояния. Перед запуском список заменяется
 * настоящими кодами (или переносится в БД).
 *
 * Даты заданы абсолютными значениями, а не «сегодня + N дней», — иначе
 * состояние «истёк» невозможно продемонстрировать стабильно.
 */
export const promoCodes: PromoCode[] = [
  {
    code: 'МИНЕРАЛ10',
    kind: 'percent',
    value: 10,
    minSubtotal: 3000,
  },
  {
    code: 'КОЛЛЕКЦИЯ500',
    kind: 'fixed',
    value: 500,
    minSubtotal: 5000,
  },
  {
    code: 'ВЕСНА',
    kind: 'percent',
    value: 15,
    // код заведомо просрочен — нужен для состояния «истёк»
    expiresAt: '2026-05-31T23:59:59.000Z',
  },
  {
    code: 'АРХИВ',
    kind: 'percent',
    value: 20,
    disabled: true,
  },
];

export const promoCodeByCode = new Map(promoCodes.map((p) => [p.code.toUpperCase(), p]));
