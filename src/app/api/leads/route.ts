import { NextResponse } from 'next/server';
import { channelLabels, leadSchema } from '@/lib/lead-schema';
import { fieldErrors } from '@/lib/order-schema';
import { getEmailProvider } from '@/services';

/**
 * Приём заявки на подбор.
 *
 * Пока почтовый провайдер не настроен, заявка попадает только в лог сервера —
 * и ответ честно сообщает об этом (`delivered: false`), чтобы интерфейс не
 * обещал покупателю связь, которой не будет.
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

  const { phone, channel, comment } = parsed.data;
  const emailProvider = getEmailProvider();

  console.info(
    `[lead] заявка: ${phone}, способ связи — ${channelLabels[channel]}${comment ? `, комментарий: ${comment}` : ''}`,
  );

  return NextResponse.json({
    ok: true,
    // false → магазин ещё не подключил почту, заявка нигде не сохранена
    delivered: emailProvider.isLive,
  });
}
