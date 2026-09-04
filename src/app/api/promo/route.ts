import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProduct, parseMoney, quoteCart } from '@/lib/admik';

export const dynamic = 'force-dynamic';

/**
 * Проверка промокода — только на стороне Admik.
 *
 * Скидку нельзя считать на витрине: заказ оформляет Admik и он же считает
 * итоговую сумму (ADR-010, anti-tamper). Если витрина посчитает скидку сама,
 * покупатель увидит одну сумму, а заплатит другую.
 *
 * Поэтому код уходит в расчёт корзины Admik `/cart/quote`, а витрина только
 * показывает его вердикт. Ошибка связи — скидки нет: пообещать скидку,
 * которую магазин не подтвердил, хуже, чем не показать её вовсе.
 */

const requestSchema = z.object({
  code: z.string().trim().min(1).max(64),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

export interface PromoCheckResult {
  applied: boolean;
  code: string | null;
  /** Сумма скидки в рублях, подтверждённая Admik */
  discount: number;
  /** Готовое сообщение для покупателя */
  message: string | null;
}

/** Ответ Admik приходит машинным кодом причины — переводим в человеческий текст */
const REASONS: Record<string, string> = {
  not_found: 'Такого промокода нет. Проверьте написание.',
  expired: 'Срок действия промокода истёк.',
  disabled: 'Промокод больше не действует.',
  used: 'Этот промокод уже использован.',
  min_subtotal: 'Сумма заказа меньше, чем требует промокод.',
  not_applicable: 'Промокод не действует на товары в корзине.',
};

function humanReason(reason: string | null): string {
  if (!reason) return 'Промокод не применён.';
  return REASONS[reason] ?? 'Промокод не применён.';
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Укажите код и состав корзины' }, { status: 400 });
  }
  const { code, items } = parsed.data;

  // корзина хранит slug — Admik ждёт uuid товара
  const resolved = await Promise.all(
    items.map(async (line) => {
      const dto = await getProduct(line.productId).catch(() => null);
      return dto ? { productId: dto.id, qty: line.quantity } : null;
    }),
  );
  const lines = resolved.filter((l): l is NonNullable<typeof l> => l !== null);
  if (lines.length === 0) {
    return NextResponse.json({ error: 'Товары корзины больше не доступны' }, { status: 409 });
  }

  try {
    const quote = await quoteCart({ items: lines, promoCode: code });
    const discount = parseMoney(quote.promo?.discount ?? quote.discountTotal);

    const result: PromoCheckResult = quote.promo?.applied
      ? {
          applied: true,
          code: quote.promo.code ?? code,
          discount,
          message: null,
        }
      : {
          applied: false,
          code: null,
          discount: 0,
          message: humanReason(quote.promo?.reason ?? null),
        };

    return NextResponse.json(result);
  } catch {
    const result: PromoCheckResult = {
      applied: false,
      code: null,
      discount: 0,
      message: 'Не удалось проверить промокод. Попробуйте позже.',
    };
    return NextResponse.json(result, { status: 200 });
  }
}
