import { NextResponse } from 'next/server';
import type { Order, OrderItem } from '@/types';
import { checkoutSchema, fieldErrors } from '@/lib/order-schema';
import { applyPromoCode } from '@/lib/promo';
import { getProductsByIds } from '@/lib/repository';
import { nextOrderNumber, saveOrder } from '@/lib/orders-store';
import { siteUrl } from '@/lib/site-url';
import { getDeliveryProvider, getEmailProvider, getPaymentProvider } from '@/services';

/**
 * Создание заказа.
 *
 * Все суммы пересчитываются на сервере по актуальным ценам — клиент присылает
 * только состав корзины. Статус оплаты не подменяется: если платёж не проведён,
 * заказ остаётся в `awaiting_payment`, а не превращается в «оплачен» (п.45 ТЗ).
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const input = parsed.data;

  const products = await getProductsByIds(input.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: OrderItem[] = [];
  for (const line of input.items) {
    const product = byId.get(line.productId);
    if (!product) {
      return NextResponse.json({ error: 'Часть товаров больше не доступна' }, { status: 409 });
    }
    if (product.status !== 'available' || product.stock <= 0) {
      return NextResponse.json(
        { error: `«${product.name}» уже недоступен. Удалите его из корзины.` },
        { status: 409 },
      );
    }
    // уникальный экземпляр физически один — больше одного не продаём
    const quantity = product.uniquePiece ? 1 : Math.min(line.quantity, product.stock);
    items.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: product.price,
      quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // промокод проверяется заново на сервере: значение из формы — только подсказка
  let discount = 0;
  let promoCode: string | undefined;
  if (input.promoCode) {
    const outcome = applyPromoCode(input.promoCode, subtotal);
    if (outcome.ok) {
      discount = outcome.applied.discount;
      promoCode = outcome.applied.code;
    }
  }

  // стоимость доставки берётся у провайдера, а не из формы
  const deliveryProvider = getDeliveryProvider();
  let deliveryPrice: number | null = null;
  let deliveryMethodName = 'Доставка';
  try {
    const weight = items.reduce((sum, item) => {
      const product = byId.get(item.productId);
      return sum + (product?.weight ?? 300) * item.quantity;
    }, 0);
    const options = await deliveryProvider.calculate(
      { city: input.city, street: input.street },
      { weight: Math.max(weight, 100), declaredValue: subtotal },
    );
    const chosen = options.find((o) => o.id === input.deliveryMethodId);
    if (chosen) {
      deliveryPrice = chosen.price;
      deliveryMethodName = chosen.name;
    }
  } catch {
    // расчёт недоступен — доставка остаётся неизвестной, но заказ создать можно
    deliveryPrice = null;
  }

  const total = Math.max(0, subtotal - discount) + (deliveryPrice ?? 0);

  const paymentProvider = getPaymentProvider();
  const methods = await paymentProvider.getMethods();
  const paymentMethod = methods.find((m) => m.id === input.paymentMethodId && m.enabled);
  if (!paymentMethod) {
    return NextResponse.json({ errors: { paymentMethodId: 'Выберите доступный способ оплаты' } }, { status: 422 });
  }

  const number = nextOrderNumber();
  const now = new Date().toISOString();

  let paymentStatus: Order['paymentStatus'] = 'pending';
  let confirmationUrl: string | undefined;
  try {
    const payment = await paymentProvider.createPayment({
      orderNumber: number,
      amount: total,
      methodId: paymentMethod.id,
      customer: { email: input.email, phone: input.phone, name: input.name },
      returnUrl: `${siteUrl}/order/success?number=${number}`,
    });
    paymentStatus = payment.state;
    confirmationUrl = payment.confirmationUrl;
  } catch {
    // платёжный шлюз недоступен — заказ всё равно принимается, но честно ждёт оплаты
    paymentStatus = 'pending';
  }

  const order: Order = {
    id: `o-${number}`,
    number,
    createdAt: now,
    // «оплачен» ставится только по факту подтверждения платежа
    status: paymentStatus === 'paid' ? 'paid' : 'awaiting_payment',
    paymentStatus,
    items,
    subtotal,
    discount,
    promoCode,
    deliveryPrice,
    total,
    customer: { name: input.name, phone: input.phone, email: input.email },
    deliveryMethodId: input.deliveryMethodId,
    deliveryMethodName,
    address: {
      city: input.city,
      street: input.street,
      pickupPointCode: input.pickupPointCode,
    },
    paymentMethodId: paymentMethod.id,
    paymentMethodName: paymentMethod.name,
    comment: input.comment,
  };

  saveOrder(order);

  // письмо не должно ронять оформление заказа
  try {
    await getEmailProvider().sendOrderCreated(order);
  } catch (cause) {
    console.error('[orders] не удалось отправить письмо', cause);
  }

  return NextResponse.json({
    order,
    confirmationUrl,
    notice: {
      paymentIsLive: paymentProvider.isLive,
      deliveryIsLive: deliveryProvider.isLive,
      emailIsLive: getEmailProvider().isLive,
    },
  });
}
