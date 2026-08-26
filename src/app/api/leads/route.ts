import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/lead-schema';
import { fieldErrors } from '@/lib/order-schema';
import { submitLead } from '@/lib/admik';

export const dynamic = 'force-dynamic';

/**
 * Вопрос магазину из формы обратной связи. Уходит в Admik
 * (POST /storefront/v1/leads) — заявки видны в админке. Если Admik недоступен,
 * отвечаем delivered:false, чтобы интерфейс не обещал ответ, которого не будет.
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

  try {
    await submitLead({ name, contact: email, message: question });
    return NextResponse.json({ ok: true, delivered: true });
  } catch {
    return NextResponse.json({ ok: true, delivered: false });
  }
}
