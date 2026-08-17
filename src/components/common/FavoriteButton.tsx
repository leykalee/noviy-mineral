'use client';

import { useStore } from '@/components/store/StoreProvider';
import { Icon } from '@/components/common/Icon';
import { cx } from '@/lib/cx';

/**
 * Кнопка избранного. Работает без авторизации (localStorage),
 * после входа данные сливаются с аккаунтом — см. StoreProvider.
 */
export function FavoriteButton({
  productId,
  productName,
  variant = 'overlay',
  className,
}: {
  productId: string;
  productName: string;
  /** overlay — поверх фотографии в карточке; inline — в строке действий на странице товара */
  variant?: 'overlay' | 'inline';
  className?: string;
}) {
  const { isFavorite, toggleFavorite, hydrated } = useStore();
  const active = hydrated && isFavorite(productId);

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(productId)}
        aria-pressed={active}
        aria-label={active ? `Убрать «${productName}» из избранного` : `Добавить «${productName}» в избранное`}
        className={cx(
          'inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--dur-fast)]',
          active
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-border-strong text-foreground hover:border-brand hover:text-brand',
          className,
        )}
      >
        <Icon name={active ? 'heart-filled' : 'heart'} size={19} />
        {active ? 'В избранном' : 'В избранное'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        // карточка целиком — ссылка, поэтому гасим переход
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productId);
      }}
      aria-pressed={active}
      aria-label={active ? `Убрать «${productName}» из избранного` : `Добавить «${productName}» в избранное`}
      className={cx(
        'grid size-11 place-items-center rounded-full transition-colors duration-[var(--dur-fast)]',
        'bg-white/90 backdrop-blur-[2px] hover:bg-white',
        active ? 'text-brand' : 'text-foreground/70 hover:text-brand',
        className,
      )}
    >
      <Icon name={active ? 'heart-filled' : 'heart'} size={20} />
    </button>
  );
}
