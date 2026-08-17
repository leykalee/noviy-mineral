'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { formatDate, formatPrice } from '@/lib/format';
import { cx } from '@/lib/cx';

/** Статус заказа и статус оплаты — разные шкалы и не смешиваются (п.43 ТЗ) */
export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'Новый',
  awaiting_payment: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'Собирается',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Оплата не подтверждена',
  authorized: 'Оплата захолдирована',
  paid: 'Оплачен',
  failed: 'Оплата не прошла',
  refunded: 'Возврат средств',
};

const orderStatusTone: Record<OrderStatus, string> = {
  new: 'bg-muted text-muted-foreground',
  awaiting_payment: 'bg-warning-soft text-warning',
  paid: 'bg-success-soft text-success',
  processing: 'bg-brand-soft text-brand',
  shipped: 'bg-brand-soft text-brand',
  delivered: 'bg-success-soft text-success',
  cancelled: 'bg-muted text-muted-foreground',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-[var(--radius-xs)] px-2.5 py-1 text-[13px] font-medium',
        orderStatusTone[status],
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
}

export function OrdersList() {
  const { orders, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-28 rounded-[var(--radius-md)]" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-14 text-center">
        <Icon name="package" size={32} className="mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-[19px] font-semibold">Заказов пока нет</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted-foreground">
          Здесь появятся оформленные заказы: состав, сумма и статус доставки.
        </p>
        <div className="mt-6">
          <ButtonLink href="/catalog">Смотреть каталог</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${encodeURIComponent(order.number)}`}
            className="block rounded-[var(--radius-md)] border border-border p-4 transition-colors duration-[var(--dur-fast)] hover:border-brand sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="tnum text-[16px] font-semibold">Заказ {order.number}</p>
                <p className="text-[14px] text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <ul className="flex -space-x-2">
                {order.items.slice(0, 5).map((item) => (
                  <li
                    key={item.productId}
                    className="relative size-12 overflow-hidden rounded-[var(--radius-xs)] border-2 border-white bg-surface-strong"
                  >
                    {item.image && (
                      <Image src={item.image.url} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </li>
                ))}
                {order.items.length > 5 && (
                  <li className="tnum grid size-12 place-items-center rounded-[var(--radius-xs)] border-2 border-white bg-muted text-[13px] text-muted-foreground">
                    +{order.items.length - 5}
                  </li>
                )}
              </ul>
              <span className="tnum shrink-0 text-[18px] font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetails({ number }: { number: string }) {
  const { orders, hydrated } = useStore();

  if (!hydrated) return <div className="skeleton h-72 rounded-[var(--radius-md)]" />;

  const order: Order | undefined = orders.find((o) => o.number === number);

  if (!order) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-14 text-center">
        <h2 className="text-[19px] font-semibold">Заказ не найден</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Заказ {number} отсутствует в этом браузере.
        </p>
        <div className="mt-6">
          <ButtonLink href="/account/orders" variant="secondary">
            Все заказы
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tnum text-[22px] font-semibold">Заказ {order.number}</h2>
          <p className="text-[14px] text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="inline-flex items-center rounded-[var(--radius-xs)] bg-muted px-2.5 py-1 text-[13px] text-muted-foreground">
            {paymentStatusLabels[order.paymentStatus]}
          </span>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 py-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-strong">
              {item.image && (
                <Image src={item.image.url} alt="" fill sizes="64px" className="object-cover" />
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

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <dl className="space-y-2.5 text-[15px]">
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
            <dd className="tnum">
              {order.deliveryPrice != null ? formatPrice(order.deliveryPrice) : 'уточняется'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="text-[16px] font-semibold">Итого</dt>
            <dd className="tnum text-[20px] font-semibold">{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <div className="text-[15px]">
          <h3 className="mb-2 font-semibold">Доставка</h3>
          <p className="text-muted-foreground">
            {order.address.city}
            {order.address.street ? `, ${order.address.street}` : ''}
            {order.address.pickupPointCode ? `, ПВЗ ${order.address.pickupPointCode}` : ''}
          </p>
          {order.trackingNumber && (
            <p className="tnum mt-2 text-muted-foreground">Накладная {order.trackingNumber}</p>
          )}

          <h3 className="mb-2 mt-5 font-semibold">Оплата</h3>
          <p className="text-muted-foreground">{order.paymentMethodName}</p>

          {order.comment && (
            <>
              <h3 className="mb-2 mt-5 font-semibold">Комментарий</h3>
              <p className="text-muted-foreground">{order.comment}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
