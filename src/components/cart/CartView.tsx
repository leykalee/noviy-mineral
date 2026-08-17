'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useStore } from '@/components/store/StoreProvider';
import { useProductsByIds } from '@/components/store/useProductsByIds';
import { storeConfig } from '@/config/store';
import { formatPrice, isPurchasable, pluralize } from '@/lib/format';
import { applyPromoCode } from '@/lib/promo';
import { cx } from '@/lib/cx';

/**
 * Корзина (п.33–35 ТЗ).
 *
 * Количество показывается только у товаров, которых физически может быть больше
 * одного. У уникального экземпляра стоит «1 экземпляр».
 * Стоимость доставки не выдумывается — она считается на шаге оформления.
 */
export function CartView() {
  const { cart, removeFromCart, setCartQuantity, hydrated, promoCode, setPromoCode } = useStore();
  const ids = useMemo(() => cart.map((i) => i.productId), [cart]);
  const { products, loading, error } = useProductsByIds(ids);

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const rows = cart
    .map((item) => ({ item, product: products.get(item.productId) }))
    .filter((row): row is { item: (typeof cart)[number]; product: NonNullable<typeof row.product> } =>
      Boolean(row.product),
    )
    .sort((a, b) => a.item.addedAt - b.item.addedAt);

  const subtotal = rows.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0);
  const unavailableRows = rows.filter(({ product }) => !isPurchasable(product.status, product.stock));

  // скидка пересчитывается от актуальной суммы: изменили корзину — изменился и итог,
  // а если условия кода перестали выполняться, скидки просто нет
  const promoOutcome = promoCode ? applyPromoCode(promoCode, subtotal) : null;
  const promo = promoOutcome?.ok ? promoOutcome.applied : null;
  const promoConditionError = promoOutcome && !promoOutcome.ok ? promoOutcome.message : null;
  const discount = promo ? promo.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const submitPromo = (event: React.FormEvent) => {
    event.preventDefault();
    const outcome = applyPromoCode(promoInput, subtotal, promoCode);
    if (outcome.ok) {
      setPromoCode(outcome.applied.code);
      setPromoError(null);
      setPromoInput('');
    } else {
      setPromoError(outcome.message);
    }
  };

  if (!hydrated || (loading && rows.length === 0 && cart.length > 0)) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 rounded-[var(--radius-md)]" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-[var(--radius-md)]" />
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-danger-soft bg-danger-soft px-6 py-8 text-center">
        <Icon name="alert" size={28} className="mx-auto text-danger" />
        <h2 className="mt-3 text-[18px] font-semibold">Не удалось загрузить корзину</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Проверьте соединение и обновите страницу.
        </p>
      </div>
    );
  }

  if (cart.length === 0 || rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-16 text-center">
        <Icon name="cart" size={34} className="mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-[20px] font-semibold">В корзине пока ничего нет</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted-foreground">
          Загляните в каталог — коллекционные образцы, изделия из камня и украшения.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/catalog">Смотреть каталог</ButtonLink>
          <ButtonLink href="/favorites" variant="secondary">
            Избранное
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <ul className="divide-y divide-border border-y border-border">
        {rows.map(({ item, product }) => {
          const available = isPurchasable(product.status, product.stock);
          const showQuantity = !product.uniquePiece && product.stock > 1;

          return (
            <li key={product.id} className="flex gap-4 py-5">
              <Link
                href={`/product/${product.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-strong sm:size-28"
              >
                {product.images[0] && (
                  <Image
                    src={product.images[0].url}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${product.slug}`}
                      className="text-[16px] font-medium hover:text-brand"
                    >
                      {product.name}
                    </Link>
                    <p className="tnum mt-0.5 text-[13px] text-muted-foreground">
                      Артикул {product.sku}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Удалить «${product.name}» из корзины`}
                    className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted hover:text-danger"
                  >
                    <Icon name="trash" size={19} />
                  </button>
                </div>

                {!available && <StatusBadge status={product.status} size="sm" className="self-start" />}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  {showQuantity ? (
                    <div className="flex h-10 items-center rounded-[var(--radius-sm)] border border-border-strong">
                      <button
                        type="button"
                        onClick={() => setCartQuantity(product.id, item.quantity - 1, product.stock)}
                        disabled={item.quantity <= 1}
                        aria-label="Уменьшить количество"
                        className="grid size-10 place-items-center hover:bg-muted disabled:opacity-40"
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <span className="tnum w-9 text-center text-[15px] font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCartQuantity(product.id, item.quantity + 1, product.stock)}
                        disabled={item.quantity >= product.stock}
                        aria-label="Увеличить количество"
                        className="grid size-10 place-items-center hover:bg-muted disabled:opacity-40"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[14px] text-muted-foreground">1 экземпляр</span>
                  )}

                  <span className="tnum text-[17px] font-semibold">
                    {formatPrice(product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-[190px] lg:self-start">
        <div className="rounded-[var(--radius-md)] bg-surface p-5">
          <h2 className="text-[18px] font-semibold">Итог</h2>

          <form onSubmit={submitPromo} className="mt-4">
            <label htmlFor="promo" className="mb-1.5 block text-[14px] font-medium">
              Промокод
            </label>
            <div className="flex gap-2">
              <input
                id="promo"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoError(null);
                }}
                placeholder="Введите код"
                aria-invalid={Boolean(promoError)}
                aria-describedby={promoError ? 'promo-error' : undefined}
                className={cx(
                  'h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border bg-white px-3 text-[15px] outline-none transition-colors duration-[var(--dur-fast)]',
                  promoError ? 'border-danger' : 'border-border-strong focus:border-brand',
                )}
              />
              <Button type="submit" variant="secondary" disabled={!promoInput.trim()}>
                Применить
              </Button>
            </div>
            {promoError && (
              <p id="promo-error" role="alert" className="mt-2 text-[14px] text-danger">
                {promoError}
              </p>
            )}
            {promo && (
              <p className="mt-2 flex items-center justify-between gap-2 text-[14px] text-success">
                <span className="flex items-center gap-1.5">
                  <Icon name="check" size={16} />
                  Промокод {promo.code} применён
                </span>
                <button
                  type="button"
                  onClick={() => setPromoCode(null)}
                  className="text-muted-foreground underline-offset-2 hover:underline"
                >
                  Убрать
                </button>
              </p>
            )}
            {promoConditionError && !promoError && (
              <p role="alert" className="mt-2 text-[14px] text-warning">
                {promoConditionError}{' '}
                <button
                  type="button"
                  onClick={() => setPromoCode(null)}
                  className="underline underline-offset-2"
                >
                  Убрать код
                </button>
              </p>
            )}
            {storeConfig.promoCodesAreDemo && !promo && (
              <p className="mt-2 text-[13px] text-muted-foreground">
                В прототипе работают демонстрационные коды, например МИНЕРАЛ10.
              </p>
            )}
          </form>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Товары, {rows.length} {pluralize(rows.length, 'позиция', 'позиции', 'позиций')}
              </dt>
              <dd className="tnum">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between gap-4 text-success">
                <dt>Скидка по промокоду</dt>
                <dd className="tnum">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Доставка</dt>
              <dd className="max-w-[58%] text-right text-[14px] text-muted-foreground">
                рассчитывается при оформлении
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="text-[17px] font-semibold">Итого</dt>
              <dd className="tnum text-[22px] font-semibold">{formatPrice(total)}</dd>
            </div>
          </dl>

          {unavailableRows.length > 0 && (
            <p className="mt-4 flex gap-2 rounded-[var(--radius-sm)] bg-warning-soft px-3 py-2.5 text-[14px] text-warning">
              <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
              <span>
                {unavailableRows.length === 1
                  ? 'Один экземпляр уже недоступен — удалите его, чтобы продолжить.'
                  : 'Часть экземпляров уже недоступна — удалите их, чтобы продолжить.'}
              </span>
            </p>
          )}

          <ButtonLink
            href="/checkout"
            size="lg"
            fullWidth
            className={cx('mt-5', unavailableRows.length > 0 && 'pointer-events-none opacity-45')}
            aria-disabled={unavailableRows.length > 0}
          >
            Перейти к оформлению
          </ButtonLink>

          <Link
            href="/catalog"
            className="mt-3 block text-center text-[15px] text-brand hover:underline"
          >
            Продолжить покупки
          </Link>
        </div>
      </aside>
    </div>
  );
}
