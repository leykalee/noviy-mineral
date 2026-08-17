import type { PromoApplied, PromoErrorCode } from '@/types';
import { promoCodeByCode } from '@/data/demo/promo-codes';
import { formatPrice } from '@/lib/format';

/**
 * Применение промокода (п.35 ТЗ).
 *
 * Скидка считается по-настоящему и влияет на итог — это не декоративная форма.
 * Поддержаны все требуемые состояния: применён, не существует, истёк,
 * не выполнены условия, уже применён.
 */

export interface PromoSuccess {
  ok: true;
  applied: PromoApplied;
}

export interface PromoFailure {
  ok: false;
  code: PromoErrorCode;
  message: string;
}

export type PromoOutcome = PromoSuccess | PromoFailure;

export function applyPromoCode(
  rawCode: string,
  subtotal: number,
  alreadyApplied?: string | null,
  now: Date = new Date(),
): PromoOutcome {
  const code = rawCode.trim().toUpperCase();

  if (alreadyApplied && alreadyApplied.toUpperCase() === code) {
    return { ok: false, code: 'already_applied', message: 'Этот промокод уже применён.' };
  }

  const promo = promoCodeByCode.get(code);
  if (!promo) {
    return { ok: false, code: 'not_found', message: 'Такого промокода нет. Проверьте написание.' };
  }

  if (promo.disabled) {
    return { ok: false, code: 'disabled', message: 'Промокод больше не действует.' };
  }

  if (promo.expiresAt && Date.parse(promo.expiresAt) < now.getTime()) {
    return { ok: false, code: 'expired', message: 'Срок действия промокода истёк.' };
  }

  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    return {
      ok: false,
      code: 'min_subtotal',
      message: `Промокод действует от ${formatPrice(promo.minSubtotal)}. В корзине ${formatPrice(subtotal)}.`,
    };
  }

  const raw = promo.kind === 'percent' ? (subtotal * promo.value) / 100 : promo.value;
  // скидка не может превысить стоимость товаров
  const discount = Math.min(Math.round(raw), subtotal);

  if (discount <= 0) {
    return { ok: false, code: 'min_subtotal', message: 'Промокод не даёт скидки на эту корзину.' };
  }

  return { ok: true, applied: { code: promo.code, discount } };
}

/** Человеческое описание условия — показываем рядом с полем ввода */
export function promoHint(code: string): string | null {
  const promo = promoCodeByCode.get(code.trim().toUpperCase());
  if (!promo) return null;
  if (promo.kind === 'percent') return `−${promo.value}%`;
  return `−${formatPrice(promo.value)}`;
}
