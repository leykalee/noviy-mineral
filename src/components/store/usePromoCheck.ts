'use client';

import { useEffect, useState } from 'react';

export interface PromoCheck {
  /** true — скидку подтвердил Admik */
  applied: boolean;
  /** Сумма скидки в рублях; ноль, пока код не подтверждён */
  discount: number;
  /** Почему код не сработал — готовый текст для покупателя */
  message: string | null;
  checking: boolean;
}

const NO_PROMO: PromoCheck = { applied: false, discount: 0, message: null, checking: false };

/**
 * Проверка промокода на стороне Admik.
 *
 * Витрина не считает скидку сама: заказ оформляет и суммирует Admik, поэтому
 * посчитанная здесь скидка разошлась бы с тем, что покупатель заплатит.
 *
 * Проверка повторяется при любом изменении состава корзины: код мог зависеть
 * от суммы заказа или от конкретных товаров.
 */
export function usePromoCheck(
  items: { productId: string; quantity: number }[],
  code: string | null,
): PromoCheck {
  const [result, setResult] = useState<PromoCheck & { key: string }>({ ...NO_PROMO, key: '' });

  // ключ учитывает и код, и состав корзины — оба влияют на вердикт
  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join(',');
  const key = code && itemsKey ? `${code}|${itemsKey}` : '';

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();

    fetch('/api/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, items }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((json: { applied?: boolean; discount?: number; message?: string | null }) => {
        setResult({
          key,
          applied: Boolean(json.applied),
          discount: json.applied ? Number(json.discount) || 0 : 0,
          message: json.applied ? null : (json.message ?? 'Промокод не применён.'),
          checking: false,
        });
      })
      .catch((cause) => {
        if (controller.signal.aborted || (cause as Error)?.name === 'AbortError') return;
        setResult({
          key,
          applied: false,
          discount: 0,
          message: 'Не удалось проверить промокод. Попробуйте позже.',
          checking: false,
        });
      });

    return () => controller.abort();
    // состав корзины уходит в тело запроса, но пересчёт завязан на строковый ключ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // состояние выводим из ключа, а не переключаем в эффекте: пока ответ по
  // текущему ключу не пришёл, скидки нет и показывается «Проверяем…»
  if (!key) return NO_PROMO;
  if (result.key !== key) return { ...NO_PROMO, checking: true };
  return {
    applied: result.applied,
    discount: result.discount,
    message: result.message,
    checking: false,
  };
}
