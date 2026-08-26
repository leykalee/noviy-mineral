import { NextResponse } from 'next/server';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { checkoutSchema, fieldErrors } from '@/lib/order-schema';
import {
  cdekCities,
  createOrder,
  getOrder,
  getProduct,
  initPayment,
  mapPaymentMethod,
  type AdmikCreateOrderInput,
  type AdmikDeliverySelection,
  type AdmikPaymentMethod,
} from '@/lib/admik';
import { fromDetail } from '@/lib/admik';

export const dynamic = 'force-dynamic';

/**
 * Создание заказа — витрина как чистый потребитель Admik. Все суммы и наличие
 * считает СЕРВЕР Admik (anti-tamper, ADR-010): клиент присылает только состав.
 * id позиций корзины = slug товара, поэтому резолвим их в uuid Admik по slug.
 */

const PAYMENT_MAP: Record<string, AdmikPaymentMethod> = {
  online: 'card',
  on_delivery: 'cod',
  cod: 'cod',
  card: 'card',
  sbp: 'sbp',
};

function mapPayment(id: string): AdmikPaymentMethod {
  return PAYMENT_MAP[id] ?? mapPaymentMethod(id);
}

const PAYMENT_NAMES: Record<string, string> = {
  online: 'Онлайн-оплата картой',
  on_delivery: 'Оплата при получении',
};

function deliverySelection(
  methodId: string,
  city: string,
  street: string | undefined,
  pickupPointCode: string | undefined,
  cityCode: number | undefined,
): { sel: AdmikDeliverySelection; name: string } {
  if (methodId.includes('courier')) {
    return {
      sel: { type: 'courier', city, cityCode, address: street },
      name: 'СДЭК — курьером до двери',
    };
  }
  if (methodId.includes('pickup') || methodId.includes('pvz')) {
    return {
      sel: { type: 'pvz', city, cityCode, pvzCode: pickupPointCode },
      name: 'СДЭК — пункт выдачи',
    };
  }
  return { sel: { type: 'pickup', city, cityCode }, name: 'Самовывоз' };
}

const ORDER_STATUSES: OrderStatus[] = [
  'new', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'authorized', 'paid', 'failed', 'refunded'];

const asOrderStatus = (s: string): OrderStatus =>
  (ORDER_STATUSES as string[]).includes(s) ? (s as OrderStatus) : 'new';
const asPaymentStatus = (s: string): PaymentStatus =>
  (PAYMENT_STATUSES as string[]).includes(s) ? (s as PaymentStatus) : 'pending';

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

  // Резолвим позиции корзины (slug → карточка Admik: uuid + снимок для UI).
  const resolved = await Promise.all(
    input.items.map(async (line) => {
      const dto = await getProduct(line.productId);
      return dto ? { dto, product: fromDetail(dto), quantity: line.quantity } : null;
    }),
  );
  if (resolved.some((r) => r === null)) {
    return NextResponse.json({ error: 'Часть товаров больше не доступна' }, { status: 409 });
  }
  const lines = resolved as NonNullable<(typeof resolved)[number]>[];

  // Код города СДЭК — best-effort (сервер Admik умеет и по имени).
  let cityCode: number | undefined;
  try {
    cityCode = (await cdekCities(input.city))[0]?.code;
  } catch {
    cityCode = undefined;
  }

  const { sel, name: deliveryMethodName } = deliverySelection(
    input.deliveryMethodId,
    input.city,
    input.street,
    input.pickupPointCode,
    cityCode,
  );

  const orderInput: AdmikCreateOrderInput = {
    items: lines.map((l) => ({ productId: l.dto.id, qty: l.quantity })),
    customer: { name: input.name, email: input.email, phone: input.phone },
    delivery: sel,
    paymentMethod: mapPayment(input.paymentMethodId),
    promoCode: input.promoCode,
    comment: input.comment,
  };

  let created;
  try {
    created = await createOrder(orderInput, { idempotencyKey: crypto.randomUUID() });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : 'Не удалось оформить заказ' },
      { status: 502 },
    );
  }

  // Полная публичная карточка заказа (итоги/статусы) по номеру+токену.
  const publicOrder = await getOrder(created.number, { token: created.accessToken }).catch(() => null);

  const items: OrderItem[] = lines.map((l) => ({
    productId: l.product.slug,
    sku: l.product.sku,
    name: l.product.name,
    slug: l.product.slug,
    image: l.product.images[0],
    price: l.product.price,
    quantity: l.quantity,
  }));

  const subtotal = publicOrder
    ? Number(publicOrder.itemsTotal)
    : items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = publicOrder ? Number(publicOrder.discountTotal) : 0;
  const deliveryPrice = publicOrder ? Number(publicOrder.deliveryTotal) : null;
  const total = Number(created.grandTotal);

  const order: Order = {
    id: created.number,
    number: created.number,
    createdAt: publicOrder?.createdAt ?? new Date().toISOString(),
    status: asOrderStatus(created.status),
    paymentStatus: asPaymentStatus(created.paymentStatus),
    items,
    subtotal,
    discount,
    promoCode: publicOrder?.promoCode ?? input.promoCode,
    deliveryPrice,
    total: Number.isFinite(total) ? total : subtotal + (deliveryPrice ?? 0) - discount,
    customer: { name: input.name, phone: input.phone, email: input.email },
    deliveryMethodId: input.deliveryMethodId,
    deliveryMethodName,
    address: {
      city: input.city,
      street: input.street,
      pickupPointCode: input.pickupPointCode,
    },
    paymentMethodId: input.paymentMethodId,
    paymentMethodName: PAYMENT_NAMES[input.paymentMethodId] ?? input.paymentMethodId,
    comment: input.comment,
  };

  // Онлайн-оплата: инициируем платёж и ведём покупателя на форму провайдера.
  let confirmationUrl: string | undefined;
  const online = mapPayment(input.paymentMethodId);
  if (online === 'card' || online === 'sbp' || online === 'cdek_pay') {
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
      const pay = await initPayment(created.number, {
        accessToken: created.accessToken,
        returnUrl: `${site}/order/success?number=${created.number}`,
      });
      confirmationUrl = pay.paymentUrl;
    } catch {
      confirmationUrl = undefined; // оплата недоступна — заказ ждёт оплаты
    }
  }

  return NextResponse.json({ order, confirmationUrl });
}
