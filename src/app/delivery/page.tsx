import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Icon } from '@/components/common/Icon';
import { storeConfig } from '@/config/store';

export const metadata: Metadata = {
  title: 'Доставка и оплата',
  description: 'Способы доставки и оплаты заказов магазина «Новый Минерал».',
  alternates: { canonical: '/delivery' },
};

/**
 * Реальные правила доставки заказчиком не переданы.
 * Страница честно об этом говорит вместо выдуманных сроков и тарифов (п.61 ТЗ).
 */
export default function DeliveryPage() {
  const { claims, deliveryRulesConfirmed } = storeConfig;

  return (
    <div className="container-page pb-16 pt-6">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Доставка и оплата' }]} />

      <h1 className="mb-8 mt-4 text-[30px] font-semibold tracking-[-0.015em] sm:text-[36px]">
        Доставка и оплата
      </h1>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="mb-4 text-[22px] font-semibold">
            Доставка
          </h2>
          <ul className="space-y-4 text-[16px] leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <Icon name="package" size={20} className="mt-1 shrink-0 text-brand" />
              <span>
                <strong className="font-medium text-foreground">Пункт выдачи СДЭК.</strong> Адрес
                выбирается при оформлении заказа из списка пунктов в вашем городе.
              </span>
            </li>
            <li className="flex gap-3">
              <Icon name="truck" size={20} className="mt-1 shrink-0 text-brand" />
              <span>
                <strong className="font-medium text-foreground">Курьером до двери.</strong>{' '}
                Стоимость и срок рассчитываются по адресу на шаге оформления.
              </span>
            </li>
            <li className="flex gap-3">
              <Icon name="info" size={20} className="mt-1 shrink-0 text-brand" />
              <span>
                Хрупкие образцы упаковываются отдельно. Точная стоимость доставки видна до
                подтверждения заказа — фиксированного тарифа нет.
              </span>
            </li>
          </ul>

          {claims.freeDeliveryFrom.enabled && (
            <p className="mt-5 rounded-[var(--radius-sm)] bg-brand-soft px-4 py-3 text-[15px] text-brand">
              Бесплатная доставка от {claims.freeDeliveryFrom.amount} ₽.
            </p>
          )}
        </section>

        <section aria-labelledby="payment-title">
          <h2 id="payment-title" className="mb-4 text-[22px] font-semibold">
            Оплата
          </h2>
          <ul className="space-y-4 text-[16px] leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <Icon name="card" size={20} className="mt-1 shrink-0 text-brand" />
              <span>
                <strong className="font-medium text-foreground">Онлайн-оплата картой.</strong>{' '}
                Доступные способы показываются на шаге оформления.
              </span>
            </li>
            <li className="flex gap-3">
              <Icon name="info" size={20} className="mt-1 shrink-0 text-brand" />
              <span>
                Заказ можно оформить без регистрации. Подтверждение приходит на указанную почту.
              </span>
            </li>
          </ul>
        </section>
      </div>

      {!deliveryRulesConfirmed && (
        <section className="mt-12 rounded-[var(--radius-md)] border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold">
            <Icon name="alert" size={20} className="text-warning" />
            Условия ещё не согласованы
          </h2>
          <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
            Точные сроки, тарифы, условия возврата и порог бесплатной доставки магазин пока не
            передавал. Здесь описан только механизм: расчёт идёт по адресу через службу доставки, а
            не по придуманной таблице. Как только заказчик передаст правила, они появятся на этой
            странице.
          </p>
          <Link href="/contacts" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:underline">
            Связаться с магазином
            <Icon name="arrow-right" size={17} />
          </Link>
        </section>
      )}
    </div>
  );
}
