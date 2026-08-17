'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { ProductCard } from '@/components/catalog/ProductCard';
import { useStore } from '@/components/store/StoreProvider';

/**
 * «Вы смотрели» (п.29 ТЗ).
 *
 * Список id живёт в localStorage, карточки подгружаются с сервера —
 * в браузер не уезжает весь каталог ради истории просмотров.
 */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const { recentlyViewed, hydrated } = useStore();
  // ответ хранится вместе с набором id, к которому относится
  const [loaded, setLoaded] = useState<{ key: string; items: Product[] }>({ key: '', items: [] });

  const idsKey = hydrated
    ? recentlyViewed
        .filter((id) => id !== excludeId)
        .slice(0, 6)
        .join(',')
    : '';

  useEffect(() => {
    if (!idsKey) return;
    const controller = new AbortController();
    fetch(`/api/products?ids=${idsKey}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((json: { items: Product[] }) => setLoaded({ key: idsKey, items: json.items }))
      .catch(() => {
        /* прерванный запрос — не ошибка */
      });
    return () => controller.abort();
  }, [idsKey]);

  // показываем только то, что соответствует текущему набору
  const products = loaded.key === idsKey ? loaded.items : [];

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="viewed-title" className="mt-16">
      <h2 id="viewed-title" className="mb-6 text-[24px] font-semibold tracking-[-0.01em]">
        Вы смотрели
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sizes="(min-width: 1280px) 200px, (min-width: 640px) 30vw, 45vw"
          />
        ))}
      </div>
    </section>
  );
}

/** Регистрирует просмотр текущего товара */
export function TrackView({ productId }: { productId: string }) {
  const { pushViewed, hydrated } = useStore();
  useEffect(() => {
    if (hydrated) pushViewed(productId);
  }, [hydrated, productId, pushViewed]);
  return null;
}
