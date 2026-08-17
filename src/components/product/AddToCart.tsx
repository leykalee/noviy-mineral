'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { isPurchasable } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Кнопка «В корзину» + выбор количества.
 *
 * Для уникального экземпляра (п.28 ТЗ) количество не выбирается вовсе:
 * stock = 1, и купить два физически невозможно.
 * Для проданного и зарезервированного кнопка выключена, но страница остаётся живой.
 */
export function AddToCart({ product }: { product: Product }) {
  const { addToCart, cart, hydrated } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const purchasable = isPurchasable(product.status, product.stock);
  const inCart = hydrated ? cart.find((i) => i.productId === product.id) : undefined;
  const remaining = Math.max(0, product.stock - (inCart?.quantity ?? 0));
  const canAddMore = purchasable && remaining > 0;

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2600);
    return () => clearTimeout(timer);
  }, [justAdded]);

  if (!purchasable) {
    return (
      <div className="rounded-[var(--radius-sm)] bg-muted px-4 py-3.5 text-[15px] text-muted-foreground">
        {product.status === 'reserved'
          ? 'Экземпляр зарезервирован другим покупателем.'
          : 'Экземпляр продан.'}{' '}
        Ниже — похожие экземпляры.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {/* выбор количества имеет смысл только там, где товара физически больше одного */}
        {!product.uniquePiece && product.stock > 1 && (
          <div className="flex h-12 items-center rounded-[var(--radius-sm)] border border-border-strong">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Уменьшить количество"
              className="grid size-12 place-items-center rounded-l-[var(--radius-sm)] text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted disabled:opacity-40"
            >
              <Icon name="minus" size={18} />
            </button>
            <span className="tnum w-10 text-center text-[16px] font-medium" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(remaining || product.stock, q + 1))}
              disabled={quantity >= (remaining || product.stock)}
              aria-label="Увеличить количество"
              className="grid size-12 place-items-center rounded-r-[var(--radius-sm)] text-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted disabled:opacity-40"
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        )}

        <Button
          size="lg"
          className="min-w-[220px] flex-1 sm:flex-none"
          disabled={!canAddMore}
          onClick={() => {
            addToCart(product.id, product.uniquePiece ? 1 : quantity, product.stock);
            setJustAdded(true);
            setQuantity(1);
          }}
        >
          {canAddMore ? (
            'В корзину'
          ) : (
            <>
              <Icon name="check" size={18} />
              Уже в корзине
            </>
          )}
        </Button>
      </div>

      {product.uniquePiece && (
        <p className="mt-3 text-[14px] text-muted-foreground">
          Экземпляр один, поэтому количество не выбирается.
        </p>
      )}

      {/* подтверждение действия, а не молчаливая кнопка */}
      <div
        aria-live="polite"
        className={cx(
          'mt-3 flex items-center gap-2 text-[15px] transition-opacity duration-[var(--dur)]',
          justAdded ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0',
        )}
      >
        <Icon name="check" size={18} className="text-success" />
        <span>Добавлено в корзину.</span>
        <Link href="/cart" className="font-medium text-brand hover:underline">
          Перейти в корзину
        </Link>
      </div>
    </div>
  );
}
