'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Order } from '@/types';
import type { DeliveryOption, PickupPoint } from '@/services/delivery/types';
import type { PaymentMethod } from '@/services/payments/types';
import { Button, ButtonLink } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Field, inputClass } from '@/components/checkout/Field';
import { useStore } from '@/components/store/StoreProvider';
import { useProductsByIds } from '@/components/store/useProductsByIds';
import { usePromoCheck } from '@/components/store/usePromoCheck';
import { checkoutSchema, fieldErrors } from '@/lib/order-schema';
import { formatPrice, isPurchasable } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Оформление в одну страницу (п.36 ТЗ): контакты, доставка, оплата, комментарий.
 * Регистрация не требуется и не встаёт между корзиной и оплатой (п.44 ТЗ).
 */

type DeliveryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; options: DeliveryOption[]; points: PickupPoint[]; isLive: boolean }
  | { status: 'error'; message: string };

export function CheckoutForm({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const { user } = useStore();
  // key по пользователю: после входа форма пересоздаётся уже предзаполненной,
  // без досинхронизации состояния через эффект
  return <CheckoutFields key={user?.id ?? 'guest'} paymentMethods={paymentMethods} />;
}

function CheckoutFields({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const router = useRouter();
  const { cart, clearCart, addOrder, user, hydrated, promoCode, setPromoCode } = useStore();
  const ids = useMemo(() => cart.map((i) => i.productId), [cart]);
  const { products, loading: productsLoading } = useProductsByIds(ids);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [deliveryMethodId, setDeliveryMethodId] = useState('');
  const [pickupPointCode, setPickupPointCode] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState(
    paymentMethods.find((m) => m.enabled)?.id ?? '',
  );
  const [comment, setComment] = useState('');
  const [promoInput, setPromoInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryState>({ status: 'idle' });
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const rows = cart
    .map((item) => ({ item, product: products.get(item.productId) }))
    .filter((row): row is { item: (typeof cart)[number]; product: NonNullable<typeof row.product> } =>
      Boolean(row.product),
    );

  const subtotal = rows.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0);
  // промокод приходит из общего состояния — он не теряется при переходе из корзины,
  // но действует он только если это подтвердил Admik: он считает сумму заказа
  const promo = usePromoCheck(
    cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    promoCode,
  );
  const discount = promo.discount;

  const selectedOption =
    delivery.status === 'ready' ? delivery.options.find((o) => o.id === deliveryMethodId) : undefined;
  const deliveryPrice = selectedOption?.price ?? null;
  const total = Math.max(0, subtotal - discount) + (deliveryPrice ?? 0);

  // состав заказа в виде строки — стабильная зависимость для расчёта доставки
  const itemsKey = rows.map(({ item }) => `${item.productId}:${item.quantity}`).join(',');

  const requestDelivery = useCallback(
    async (targetCity: string, items: string) => {
      if (targetCity.trim().length < 2 || !items) {
        setDelivery({ status: 'idle' });
        return;
      }
      const parsed = items.split(',').map((pair) => {
        const [productId, quantity] = pair.split(':');
        return { productId, quantity: Number(quantity) };
      });
      setDelivery({ status: 'loading' });
      try {
        const response = await fetch('/api/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: targetCity, items: parsed }),
        });
        const json = await response.json();
        if (!response.ok) {
          setDelivery({ status: 'error', message: json.error ?? 'Не удалось рассчитать доставку' });
          return;
        }
        setDelivery({
          status: 'ready',
          options: json.options,
          points: json.pickupPoints,
          isLive: json.provider?.isLive ?? false,
        });
        setDeliveryMethodId((current) =>
          json.options.some((o: DeliveryOption) => o.id === current)
            ? current
            : (json.options[0]?.id ?? ''),
        );
      } catch {
        setDelivery({ status: 'error', message: 'Сервис доставки временно недоступен' });
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => void requestDelivery(city, itemsKey), 500);
    return () => clearTimeout(timer);
  }, [city, itemsKey, requestDelivery]);

  const submitPromo = (event: React.FormEvent) => {
    event.preventDefault();
    const code = promoInput.trim();
    if (!code) return;
    setPromoCode(code);
    setPromoInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const payload = {
      name,
      phone,
      email,
      city,
      street: street || undefined,
      deliveryMethodId,
      pickupPointCode: pickupPointCode || undefined,
      paymentMethodId,
      comment: comment || undefined,
      promoCode: promo.applied ? (promoCode ?? undefined) : undefined,
      items: rows.map(({ item }) => ({ productId: item.productId, quantity: item.quantity })),
    };

    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next);
      errorSummaryRef.current?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await response.json();

      if (!response.ok) {
        if (json.errors) {
          setErrors(json.errors);
          errorSummaryRef.current?.focus();
        } else {
          setSubmitError(json.error ?? 'Не удалось оформить заказ. Попробуйте ещё раз.');
        }
        return;
      }

      const order = json.order as Order;
      addOrder(order);
      clearCart();
      // внешняя платёжная форма, если провайдер её вернул
      if (json.confirmationUrl) {
        window.location.assign(json.confirmationUrl);
        return;
      }
      router.push(`/order/success?number=${encodeURIComponent(order.number)}`);
    } catch {
      setSubmitError('Сеть недоступна. Проверьте соединение и повторите.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || (productsLoading && rows.length === 0 && cart.length > 0)) {
    return <div className="skeleton h-96 rounded-[var(--radius-md)]" />;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface px-6 py-16 text-center">
        <Icon name="cart" size={32} className="mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-[20px] font-semibold">Оформлять пока нечего</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">В корзине нет товаров.</p>
        <div className="mt-6">
          <ButtonLink href="/catalog">Смотреть каталог</ButtonLink>
        </div>
      </div>
    );
  }

  const blocked = rows.some(({ product }) => !isPurchasable(product.status, product.stock));

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="space-y-10">
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          aria-live="polite"
          className={cx(Object.keys(errors).length === 0 && 'sr-only-focusable absolute')}
        >
          {Object.keys(errors).length > 0 && (
            <p className="flex gap-2.5 rounded-[var(--radius-sm)] bg-danger-soft px-4 py-3 text-[15px] text-danger">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              Проверьте выделенные поля — заказ не отправлен.
            </p>
          )}
        </div>

        <section aria-labelledby="contacts-title">
          <h2 id="contacts-title" className="mb-4 text-[20px] font-semibold">
            Контакты
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" required error={errors.name}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClass(invalid)}
                />
              )}
            </Field>
            <Field label="Телефон" required error={errors.phone}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+7 900 000-00-00"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClass(invalid)}
                />
              )}
            </Field>
            <Field
              label="Электронная почта"
              required
              error={errors.email}
              hint="На неё придёт подтверждение заказа"
              className="sm:col-span-2"
            >
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClass(invalid)}
                />
              )}
            </Field>
          </div>
        </section>

        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="mb-4 text-[20px] font-semibold">
            Доставка
          </h2>

          <Field label="Город" required error={errors.city} className="max-w-[360px]">
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder="Москва"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={inputClass(invalid)}
              />
            )}
          </Field>

          <div className="mt-4">
            {delivery.status === 'idle' && (
              <p className="text-[15px] text-muted-foreground">
                Укажите город — рассчитаем доступные способы доставки.
              </p>
            )}

            {delivery.status === 'loading' && (
              <div className="space-y-2.5" aria-live="polite">
                <div className="skeleton h-16 rounded-[var(--radius-sm)]" />
                <div className="skeleton h-16 rounded-[var(--radius-sm)]" />
              </div>
            )}

            {delivery.status === 'error' && (
              <div className="rounded-[var(--radius-sm)] bg-warning-soft px-4 py-3 text-[15px] text-warning">
                <p className="flex gap-2.5">
                  <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
                  <span>{delivery.message}</span>
                </p>
                <button
                  type="button"
                  onClick={() => void requestDelivery(city, itemsKey)}
                  className="mt-2 font-medium underline underline-offset-2"
                >
                  Повторить расчёт
                </button>
              </div>
            )}

            {delivery.status === 'ready' && (
              <>
                {!delivery.isLive && (
                  <p className="mb-3 flex gap-2.5 rounded-[var(--radius-sm)] bg-warning-soft px-4 py-3 text-[14px] text-warning">
                    <Icon name="info" size={17} className="mt-0.5 shrink-0" />
                    <span>
                      Тарифы демонстрационные: боевой расчёт СДЭК подключается после получения
                      доступов.
                    </span>
                  </p>
                )}

                <fieldset>
                  <legend className="sr-only-focusable absolute">Способ доставки</legend>
                  <div className="space-y-2.5">
                    {delivery.options.map((option) => (
                      <label
                        key={option.id}
                        className={cx(
                          'flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border p-4 transition-colors duration-[var(--dur-fast)]',
                          deliveryMethodId === option.id
                            ? 'border-brand bg-brand-soft'
                            : 'border-border-strong hover:border-brand',
                        )}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={deliveryMethodId === option.id}
                          onChange={() => setDeliveryMethodId(option.id)}
                          className="mt-1 size-4 accent-[var(--brand)]"
                        />
                        <span className="flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[16px] font-medium">{option.name}</span>
                            <span className="tnum text-[16px] font-medium">
                              {option.price != null ? formatPrice(option.price) : 'по тарифу'}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[14px] text-muted-foreground">
                            {option.minDays}–{option.maxDays} дней
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.deliveryMethodId && (
                    <p role="alert" className="mt-2 text-[13px] text-danger">
                      {errors.deliveryMethodId}
                    </p>
                  )}
                </fieldset>

                {selectedOption?.requiresPickupPoint && (
                  <Field
                    label="Пункт выдачи"
                    required
                    error={errors.pickupPointCode}
                    className="mt-4"
                  >
                    {({ id, describedBy, invalid }) => (
                      <select
                        id={id}
                        value={pickupPointCode}
                        onChange={(e) => setPickupPointCode(e.target.value)}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        className={inputClass(invalid)}
                      >
                        <option value="">Выбрать пункт выдачи</option>
                        {delivery.points.map((point) => (
                          <option key={point.code} value={point.code}>
                            {point.address}
                            {point.workTime ? ` — ${point.workTime}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                )}

                {selectedOption && !selectedOption.requiresPickupPoint && (
                  <Field label="Адрес доставки" required error={errors.street} className="mt-4">
                    {({ id, describedBy, invalid }) => (
                      <input
                        id={id}
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        autoComplete="street-address"
                        placeholder="Улица, дом, квартира"
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        className={inputClass(invalid)}
                      />
                    )}
                  </Field>
                )}
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="payment-title">
          <h2 id="payment-title" className="mb-4 text-[20px] font-semibold">
            Оплата
          </h2>
          <fieldset>
            <legend className="sr-only-focusable absolute">Способ оплаты</legend>
            <div className="space-y-2.5">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={cx(
                    'flex items-start gap-3 rounded-[var(--radius-sm)] border p-4 transition-colors duration-[var(--dur-fast)]',
                    !method.enabled && 'opacity-55',
                    method.enabled && 'cursor-pointer',
                    paymentMethodId === method.id
                      ? 'border-brand bg-brand-soft'
                      : 'border-border-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    disabled={!method.enabled}
                    checked={paymentMethodId === method.id}
                    onChange={() => setPaymentMethodId(method.id)}
                    className="mt-1 size-4 accent-[var(--brand)]"
                  />
                  <span>
                    <span className="block text-[16px] font-medium">{method.name}</span>
                    {method.hint && (
                      <span className="mt-0.5 block text-[14px] text-muted-foreground">
                        {method.hint}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {errors.paymentMethodId && (
              <p role="alert" className="mt-2 text-[13px] text-danger">
                {errors.paymentMethodId}
              </p>
            )}
          </fieldset>
        </section>

        <section aria-labelledby="comment-title">
          <h2 id="comment-title" className="mb-4 text-[20px] font-semibold">
            Комментарий
          </h2>
          <Field label="Комментарий к заказу" error={errors.comment} hint="Необязательно">
            {({ id, describedBy, invalid }) => (
              <textarea
                id={id}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={cx(inputClass(invalid), 'h-auto py-3 leading-relaxed')}
              />
            )}
          </Field>
        </section>
      </div>

      <aside className="lg:sticky lg:top-[190px] lg:self-start">
        <div className="rounded-[var(--radius-md)] bg-surface p-5">
          <h2 className="text-[18px] font-semibold">Ваш заказ</h2>

          <ul className="mt-4 space-y-3 border-b border-border pb-4">
            {rows.map(({ item, product }) => (
              <li key={product.id} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-strong">
                  {product.images[0] && (
                    <Image src={product.images[0].url} alt="" fill sizes="56px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/product/${product.slug}`} className="block truncate text-[15px] hover:text-brand">
                    {product.name}
                  </Link>
                  <span className="tnum block text-[13px] text-muted-foreground">
                    {product.sku}
                    {item.quantity > 1 && ` · ${item.quantity} шт.`}
                  </span>
                </span>
                <span className="tnum shrink-0 text-[15px] font-medium">
                  {formatPrice(product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <form onSubmit={submitPromo} className="mt-4">
            <label htmlFor="checkout-promo" className="mb-1.5 block text-[14px] font-medium">
              Промокод
            </label>
            <div className="flex gap-2">
              <input
                id="checkout-promo"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                aria-invalid={Boolean(promo.message)}
                className={cx(
                  'h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border bg-white px-3 text-[15px] outline-none',
                  promo.message ? 'border-danger' : 'border-border-strong focus:border-brand',
                )}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={submitPromo}
                disabled={!promoInput.trim() || promo.checking}
              >
                {promo.checking ? 'Проверяем…' : 'Применить'}
              </Button>
            </div>
            {promo.message && (
              <p role="alert" className="mt-2 text-[14px] text-danger">
                {promo.message}{' '}
                <button
                  type="button"
                  onClick={() => setPromoCode(null)}
                  className="underline underline-offset-2"
                >
                  Убрать код
                </button>
              </p>
            )}
            {promo.applied && promoCode && (
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-success">
                <Icon name="check" size={16} />
                Промокод {promoCode} применён
              </p>
            )}
          </form>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Товары</dt>
              <dd className="tnum">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between gap-4 text-success">
                <dt>Скидка</dt>
                <dd className="tnum">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Доставка</dt>
              <dd className="tnum text-right">
                {deliveryPrice != null ? (
                  formatPrice(deliveryPrice)
                ) : (
                  <span className="text-[14px] text-muted-foreground">укажите город</span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="text-[17px] font-semibold">Итого</dt>
              <dd className="tnum text-[22px] font-semibold">{formatPrice(total)}</dd>
            </div>
          </dl>

          {submitError && (
            <p role="alert" className="mt-4 flex gap-2 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2.5 text-[14px] text-danger">
              <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth className="mt-5" disabled={submitting || blocked}>
            {submitting ? 'Оформляем…' : 'Оформить заказ'}
          </Button>

          <p className="mt-3 text-[13px] text-muted-foreground">
            Регистрация не требуется — заказ можно оформить как гость.
          </p>
        </div>
      </aside>
    </form>
  );
}
