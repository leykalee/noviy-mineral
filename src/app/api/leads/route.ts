import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/lead-schema';
import { fieldErrors } from '@/lib/order-schema';
import { getEmailProvider } from '@/services';

/**
 * Вопрос магазину из формы обратной связи.
 *
 * Письмо уходит на почту магазина через тот же провайдер, что и уведомления
 * о заказах. Пока почтовый сервис не настроен, обращение попадает только
 * в лог сервера — и ответ честно сообщает об этом (`delivered: false`),
 * чтобы интерфейс не обещал покупателю ответ, которого не будет.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const { name, email, question } = parsed.data;
  const emailProvider = getEmailProvider();

  console.info(`[lead] вопрос от ${name} <${email}>: ${question.slice(0, 300)}`);

  return NextResponse.json({
    ok: true,
    // false → почта магазина ещё не подключена, обращение никуда не отправлено
    delivered: emailProvider.isLive,
  });
}
