import { z } from 'zod';

/**
 * Заявка на подбор экземпляра.
 *
 * Одна схема на клиент и сервер: браузеру не доверяем, проверяем повторно.
 */

const phonePattern = /^\+?[\d\s()-]{10,20}$/;

export const CONTACT_CHANNELS = ['call', 'telegram', 'whatsapp'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const channelLabels: Record<ContactChannel, string> = {
  call: 'Позвонить',
  telegram: 'Написать в Telegram',
  whatsapp: 'Написать в WhatsApp',
};

export const leadSchema = z.object({
  // сообщение задано и для отсутствующего поля — иначе Zod отдаёт
  // техническую строку на английском
  phone: z
    .string({ message: 'Укажите номер телефона' })
    .trim()
    .regex(phonePattern, 'Проверьте номер телефона'),
  channel: z.enum(CONTACT_CHANNELS, { message: 'Выберите, как с вами связаться' }),
  comment: z.string({ message: 'Слишком длинный текст' }).trim().max(600, 'Слишком длинный текст').optional(),
  consent: z.literal(true, { message: 'Нужно согласие на обработку данных' }),
});

export type LeadInput = z.infer<typeof leadSchema>;
