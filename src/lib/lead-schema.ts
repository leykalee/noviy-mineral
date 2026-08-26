import { z } from 'zod';

/**
 * Вопрос магазину из формы обратной связи.
 *
 * Телефон не спрашиваем: покупателю проще написать вопрос и оставить почту
 * для ответа. Одна схема на клиент и сервер — браузеру не доверяем.
 */

export const leadSchema = z.object({
  name: z.string({ message: 'Укажите имя' }).trim().min(2, 'Укажите имя'),
  email: z
    .string({ message: 'Укажите почту для ответа' })
    .trim()
    .email('Проверьте адрес электронной почты'),
  question: z
    .string({ message: 'Напишите вопрос' })
    .trim()
    .min(5, 'Напишите вопрос подробнее')
    .max(2000, 'Слишком длинный текст'),
  consent: z.literal(true, { message: 'Нужно согласие на обработку данных' }),
});

export type LeadInput = z.infer<typeof leadSchema>;
