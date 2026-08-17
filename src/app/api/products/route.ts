import { NextResponse } from 'next/server';
import { getProductsByIds } from '@/lib/repository';

/** Точечная выборка товаров по id — для «Вы смотрели», избранного и корзины. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('ids') ?? '';
  const ids = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 60); // ограничение, чтобы одним запросом не выкачали каталог

  if (ids.length === 0) return NextResponse.json({ items: [] });

  const items = await getProductsByIds(ids);
  return NextResponse.json({ items });
}
