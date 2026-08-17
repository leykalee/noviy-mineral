'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import type { Order } from '@/types';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { formatPrice } from '@/lib/format';

/**
 * Страница успешного оформления (п.45 ТЗ).
 *
 * Показывается настоящее состояние: если платёж не подтверждён, пишем
 * «ожидает оплаты», а не «оплата прошла успешно».
 */
export function OrderSuccess({ number }: { number: string | null }) {
  const { orders, hydrated, user } = useStore();

  // заказ выводится из уже загруженного списка — отдельное состояние не нужно
  const order: Order | null = useMemo(
    () => (number ? (orders.find((o) => o.number === number) ?? null) : null),
    [orders, number],
  );

  if (!hydrated) {
    return <div className="skeleton h-64 rounded-[var(--radius-md)]" />;
  }

  if (!order) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-14 text-center">
        <h1 className="text-[24px] font-semibold">Заказ не найден</h1>
        <p className="mx-auto mt-2 max-w-[48ch] text-[15px] text-muted-foreground">
          {number
            ? `Заказ ${number} не найден в этом браузере. Если вы оформляли его на другом устройстве, откройте личный кабинет.`
            : 'Не указан номер заказа.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account/orders">Мои заказы</ButtonLink>
          <ButtonLink href="/catalog" variant="secondary">
            В каталог
          </ButtonLink>
        </div>
      </div>
    );
  }

  const paid = order.paymentStatus === 'paid';

  return (
    <div>
      <div className="flex items-start gap-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-full ${paid ? 'bg-success-soft text-success' : 'bg-brand-soft text-brand'}`}
        >
          <Icon name={paid ? 'check' : 'package'} size={26} />
        </span>
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em]">Заказ оформлен</h1>
          <p className="tnum mt-1 text-[16px] text-muted-foreground">Номер {order.number}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div>
          <section
            className={`rounded-[var(--radius-md)] px-5 py-4 ${paid ? 'bg-success-soft' : 'bg-warning-soft'}`}
          >
            <h2 className={`text-[16px] font-semibold ${paid ? 'text-success' : 'text-warning'}`}>
              {paid ? 'Оплата получена' : 'Ожидает оплаты'}
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {paid
                ? 'Мы начали готовить отправление.'
                : 'Платёж пока не подтверждён. Мы свяжемся с вами и пришлём ссылку на оплату.'}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-[18px] font-semibold">Что дальше</h2>
            <ol className="space-y-2 text-[15px] text-muted-foreground">
              <li>1. Подтверждение отправлено на {order.customer.email}.</li>
              <li>2. Магазин проверит наличие экземпляров и свяжется с вами.</li>
              <li>3. После оплаты заказ будет передан в доставку.</li>
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-[18px] font-semibold">Состав заказа</h2>
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-strong">
                    {item.image && (
                      <Image src={item.image.url} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/product/${item.slug}`} className="block truncate text-[15px] hover:text-brand">
                      {item.name}
                    </Link>
                    <span className="tnum block text-[13px] text-muted-foreground">
                      {item.sku}
                      {item.quantity > 1 && ` · ${item.quantity} шт.`}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[15px] font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside>
          <div className="rounded-[var(--radius-md)] bg-surface p-5">
            <h2 className="text-[17px] font-semibold">Итог</h2>
            <dl className="mt-4 space-y-2.5 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Товары</dt>
                <dd className="tnum">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-4 text-success">
                  <dt>Скидка{order.promoCode ? ` (${order.promoCode})` : ''}</dt>
                  <dd className="tnum">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{order.deliveryMethodName}</dt>
                <dd className="tnum text-right">
                  {order.deliveryPrice != null ? (
                    formatPrice(order.deliveryPrice)
                  ) : (
                    <span className="text-[14px]">уточняется</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                <dt className="text-[16px] font-semibold">Итого</dt>
                <dd className="tnum text-[20px] font-semibold">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-4 text-[14px] text-muted-foreground">
              <p className="font-medium text-foreground">Доставка</p>
              <p className="mt-1">
                {order.address.city}
                {order.address.street ? `, ${order.address.street}` : ''}
                {order.address.pickupPointCode ? `, ПВЗ ${order.address.pickupPointCode}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {/* гостя не отправляем в кабинет: там его ждёт форма входа, а не заказ */}
            {user ? (
              <>
                <ButtonLink href="/account/orders" fullWidth>
                  Мои заказы
                </ButtonLink>
                <ButtonLink href="/catalog" variant="secondary" fullWidth>
                  Продолжить покупки
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/catalog" fullWidth>
                  Продолжить покупки
                </ButtonLink>
                <p className="px-1 text-[13px] text-muted-foreground">
                  Заказ сохранён в этом браузере. Зарегистрируйтесь с адресом{' '}
                  {order.customer.email}, чтобы видеть его в личном кабинете с любого устройства.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
