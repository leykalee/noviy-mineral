'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types';

/**
 * Подгружает карточки товаров по списку id.
 *
 * Корзина и избранное хранят только id, поэтому данные о товаре всегда берутся
 * с сервера: цена и статус не «замораживаются» в localStorage и не устаревают.
 */
export function useProductsByIds(ids: string[]): {
  products: Map<string, Product>;
  loading: boolean;
  error: boolean;
} {
  const [state, setState] = useState<{
    key: string;
    products: Map<string, Product>;
    loading: boolean;
    error: boolean;
  }>({ key: '', products: new Map(), loading: false, error: false });

  // ключ по составу списка: перезапрашиваем только при реальном изменении набора
  const key = ids.join(',');

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();

    fetch(`/api/products?ids=${key}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((json: { items: Product[] }) => {
        setState({
          key,
          products: new Map(json.items.map((p) => [p.id, p])),
          loading: false,
          error: false,
        });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setState({ key, products: new Map(), loading: false, error: true });
      });

    return () => controller.abort();
  }, [key]);

  // пока ответ по текущему набору не пришёл, считаем данные загружающимися:
  // так состояние выводится из props, а не досинхронизируется через setState
  const fresh = state.key === key;
  return {
    products: fresh ? state.products : new Map(),
    loading: Boolean(key) && !fresh,
    error: fresh && state.error,
  };
}
