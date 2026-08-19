'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { isPurchasable, statusLabels } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Добавление в корзину прямо из каталога — без перехода в карточку товара.
 *
 * Количество здесь не выбирается (п.22 ТЗ): у коллекционного образца экземпляр
 * всё равно один. Недоступный экземпляр показывает выключенную кнопку, а не
 * прячет её — так видно, что товар есть, но купить его нельзя.
 */
export function QuickAddButton({ product }: { product: Product }) {
  const { addToCart, cart, hydrated } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const purchasable = isPurchasable(product.status, product.stock);
  const inCart = hydrated ? cart.find((i) => i.productId === product.id) : undefined;
  const canAdd = purchasable && (inCart?.quantity ?? 0) < product.stock;

  const label = !purchasable
    ? `${product.name}: ${statusLabels[product.status].toLowerCase()}`
    : canAdd
      ? `Добавить «${product.name}» в корзину`
      : `«${product.name}» уже в корзине`;

  return (
    <button
      type="button"
      disabled={!canAdd}
      aria-label={label}
      title={label}
      onClick={(event) => {
        // карточка целиком — ссылка, поэтому гасим переход
        event.preventDefault();
        event.stopPropagation();
        addToCart(product.id, 1, product.stock);
        setJustAdded(true);
      }}
      className={cx(
        'grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border transition-colors duration-[var(--dur-fast)]',
        canAdd
          ? 'border-border-strong text-foreground hover:border-brand hover:bg-brand-soft hover:text-brand'
          : inCart
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-border text-muted-foreground opacity-45',
      )}
    >
      <Icon name={justAdded || inCart ? 'check' : 'cart'} size={19} />
    </button>
  );
}
