import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDeliveryProvider } from '@/services';
import { getProductsByIds } from '@/lib/repository';

/**
 * Расчёт доставки и список ПВЗ.
 *
 * Вес и объявленная ценность считаются на сервере по реальным товарам заказа,
 * а не приходят из браузера — иначе тариф можно было бы занизить подделкой запроса.
 */

const requestSchema = z.object({
  city: z.string().trim().min(2),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

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
  const products = await getProductsByIds(items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  let weight = 0;
  let declaredValue = 0;
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    weight += (product.weight ?? 300) * item.quantity;
    declaredValue += product.price * item.quantity;
  }

  const provider = getDeliveryProvider();

  try {
    const [options, points] = await Promise.all([
      provider.calculate({ city }, { weight: Math.max(weight, 100), declaredValue }),
      provider.getPickupPoints(city),
    ]);

    return NextResponse.json({
      provider: { id: provider.id, name: provider.name, isLive: provider.isLive },
      options,
      pickupPoints: points,
    });
  } catch (cause) {
    // расчёт не удался — интерфейс обязан показать это состояние, а не молчать
    return NextResponse.json(
      {
        error: cause instanceof Error ? cause.message : 'Не удалось рассчитать доставку',
        provider: { id: provider.id, name: provider.name, isLive: provider.isLive },
      },
      { status: 502 },
    );
  }
}
