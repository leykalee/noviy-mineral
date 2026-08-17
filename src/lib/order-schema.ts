import { z } from 'zod';

/**
 * Валидация оформления заказа.
 *
 * Одна схема используется и на клиенте (подсветка полей), и на сервере
 * (запрос из браузера доверенным не считается).
 */

const phonePattern = /^\+?[\d\s()-]{10,20}$/;

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, 'Укажите имя'),
    phone: z
      .string()
      .trim()
      .regex(phonePattern, 'Проверьте номер телефона'),
    email: z.string().trim().email('Проверьте адрес электронной почты'),

    city: z.string().trim().min(2, 'Укажите город'),
    deliveryMethodId: z.string().min(1, 'Выберите способ доставки'),
    pickupPointCode: z.string().optional(),
    street: z.string().trim().optional(),

    paymentMethodId: z.string().min(1, 'Выберите способ оплаты'),
    comment: z.string().trim().max(600, 'Комментарий слишком длинный').optional(),

    promoCode: z.string().trim().optional(),
    items: z
      .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) }))
      .min(1, 'Корзина пуста'),
  })
  .superRefine((value, ctx) => {
    // адрес обязателен для курьера, ПВЗ — для пункта выдачи
    if (value.deliveryMethodId.includes('courier') && !value.street) {
      ctx.addIssue({
        code: 'custom',
        path: ['street'],
        message: 'Укажите адрес доставки',
      });
    }
    if (value.deliveryMethodId.includes('pickup') && !value.pickupPointCode) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupPointCode'],
        message: 'Выберите пункт выдачи',
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Ошибки в виде «поле → сообщение» — так их удобно рисовать под инпутами */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
