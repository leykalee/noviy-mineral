import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { DeliveryOption, PickupPoint } from '@/services/delivery/types';
import { cdekCalculate, cdekCities, cdekPvz } from '@/lib/admik';

export const dynamic = 'force-dynamic';

/**
 * Расчёт доставки и список ПВЗ — прокси к СДЭК через Admik Storefront API.
 * Ключи СДЭК живут в Admik и на фронт не утекают. Вес/ценность считает Admik.
 *
 * Контракт ответа сохранён прежним (options[] + pickupPoints[]), чтобы
 * CheckoutForm не менялся: id способов содержат 'pickup'/'courier' — от этого
 * зависит валидация формы (ПВЗ ⇒ нужен код пункта, курьер ⇒ нужен адрес).
 */

const requestSchema = z.object({
  city: z.string().trim().min(2),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

const PROVIDER = { id: 'cdek', name: 'СДЭК', isLive: true };

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Укажите город и состав заказа' }, { status: 400 });
  }

  const { city, items } = parsed.data;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  try {
    const cities = await cdekCities(city);
    const match = cities[0];
    if (!match) {
      return NextResponse.json({
        provider: PROVIDER,
        options: [],
        pickupPoints: [],
        notice: 'Город не найден в справочнике СДЭК — уточните название.',
      });
    }

    const lines = [{ qty: totalQty }];
    const [pvzCalc, doorCalc, pvz] = await Promise.all([
      cdekCalculate({ to: { city_code: match.code }, deliveryMode: 'pvz', items: lines }).catch(() => null),
      cdekCalculate({ to: { city_code: match.code }, deliveryMode: 'door', items: lines }).catch(() => null),
      cdekPvz({ cityCode: match.code }).catch(() => []),
    ]);

    const options: DeliveryOption[] = [];
    if (pvzCalc) {
      options.push({
        id: 'cdek-pickup',
        name: 'СДЭК — пункт выдачи',
        kind: 'pickup_point',
        price: pvzCalc.cost,
        minDays: pvzCalc.periodMin,
        maxDays: pvzCalc.periodMax,
        requiresPickupPoint: true,
      });
    }
    if (doorCalc) {
      options.push({
        id: 'cdek-courier',
        name: 'СДЭК — курьером до двери',
        kind: 'courier',
        price: doorCalc.cost,
        minDays: doorCalc.periodMin,
        maxDays: doorCalc.periodMax,
        requiresPickupPoint: false,
      });
    }

    const pickupPoints: PickupPoint[] = pvz.map((p) => ({
      code: p.code,
      name: p.name,
      address: p.address,
      workTime: p.workTime,
    }));

    return NextResponse.json({ provider: PROVIDER, options, pickupPoints, cityCode: match.code });
  } catch (cause) {
    return NextResponse.json(
      {
        error: cause instanceof Error ? cause.message : 'Не удалось рассчитать доставку',
        provider: PROVIDER,
      },
      { status: 502 },
    );
  }
}
