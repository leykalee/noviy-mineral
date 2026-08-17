'use client';

import { useMemo } from 'react';
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { useProductsByIds } from '@/components/store/useProductsByIds';

/**
 * Избранное (п.32, п.65 ТЗ).
 * Работает без авторизации; после входа список сливается с аккаунтом.
 */
export function FavoritesView() {
  const { favorites, hydrated, user } = useStore();
  const ids = useMemo(
    () => [...favorites].sort((a, b) => b.addedAt - a.addedAt).map((f) => f.productId),
    [favorites],
  );
  const { products, loading, error } = useProductsByIds(ids);

  if (!hydrated || (loading && ids.length > 0)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-md)] border border-danger-soft bg-danger-soft px-6 py-8 text-center">
        <Icon name="alert" size={28} className="mx-auto text-danger" />
        <h2 className="mt-3 text-[18px] font-semibold">Не удалось загрузить избранное</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">Обновите страницу и попробуйте снова.</p>
      </div>
    );
  }

  const items = ids.map((id) => products.get(id)).filter((p) => p !== undefined);

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-16 text-center">
        <Icon name="heart" size={34} className="mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-[20px] font-semibold">Пока здесь пусто</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[15px] text-muted-foreground">
          Сохраняйте понравившиеся минералы, чтобы вернуться к ним позже.
        </p>
        <div className="mt-6">
          <ButtonLink href="/catalog">Перейти в каталог</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user && (
        <p className="mb-6 flex gap-2.5 rounded-[var(--radius-sm)] bg-brand-soft px-4 py-3 text-[15px] text-brand">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <span>
            Список сохранён в этом браузере. Войдите в кабинет — избранное перенесётся в аккаунт и
            не потеряется.
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
