'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/types';
import { useStore } from '@/components/store/StoreProvider';
import { formatPrice, isPurchasable, statusLabels } from '@/lib/format';

/**
 * Липкая панель покупки на мобильных (п.54 ТЗ).
 *
 * Появляется только когда основная кнопка ушла за пределы экрана — иначе
 * рядом были бы две одинаковые кнопки. Учитывает safe-area.
 */
export function StickyMobileBar({
  product,
  watchId,
}: {
  product: Product;
  /** id основной кнопки покупки — за ней и следим */
  watchId: string;
}) {
  const { addToCart, cart, hydrated } = useStore();
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observerRef.current.observe(target);
    return () => observerRef.current?.disconnect();
  }, [watchId]);

  const purchasable = isPurchasable(product.status, product.stock);
  const inCart = hydrated ? cart.find((i) => i.productId === product.id) : undefined;
  const canAdd = purchasable && (inCart?.quantity ?? 0) < product.stock;

  if (!visible) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white px-4 pt-3 shadow-[var(--shadow-sheet)] lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="tnum text-[18px] font-semibold leading-tight">{formatPrice(product.price)}</p>
          {!purchasable && (
            <p className="text-[13px] text-muted-foreground">{statusLabels[product.status]}</p>
          )}
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => addToCart(product.id, 1, product.stock)}
          className="h-12 shrink-0 rounded-[var(--radius-sm)] bg-brand px-6 text-[15px] font-medium text-white transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover disabled:opacity-45"
        >
          {canAdd ? 'В корзину' : inCart ? 'В корзине' : 'Недоступен'}
        </button>
      </div>
    </div>
  );
}
