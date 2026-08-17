import { NextResponse } from 'next/server';
import { minerals, deposits, categories } from '@/data/demo/taxonomy';
import { queryProducts } from '@/lib/repository';

/**
 * Подсказки для панели поиска (п.30 ТЗ).
 *
 * Возвращает три группы: минеральные виды, товары и «возможно» —
 * месторождения и категории. Поиск понимает название, артикул, минерал,
 * месторождение, регион и категорию.
 */

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();

  if (q.length < 2) {
    return NextResponse.json({ minerals: [], products: [], other: [] });
  }

  const needle = normalize(q);

  const mineralHits = minerals
    .filter((m) => normalize(m.name).includes(needle))
    .slice(0, 5)
    .map((m) => ({ slug: m.slug, name: m.name }));

  const depositHits = deposits
    .filter(
      (d) =>
        normalize(d.name).includes(needle) ||
        normalize(d.country).includes(needle) ||
        (d.region ? normalize(d.region).includes(needle) : false),
    )
    .slice(0, 3)
    .map((d) => ({
      label: d.name,
      hint: [d.country, d.region].filter(Boolean).join(', '),
      href: `/catalog?deposit=${encodeURIComponent(d.slug)}`,
    }));

  const categoryHits = categories
    .filter((c) => normalize(c.name).includes(needle))
    .slice(0, 3)
    .map((c) => ({ label: c.name, hint: 'Категория', href: `/catalog/${c.slug}` }));

  const { items, total } = await queryProducts({ q, perPage: 6, sort: 'popular' });

  return NextResponse.json({
    minerals: mineralHits,
    products: items.map((p) => ({
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      price: p.price,
      image: p.images[0]?.url ?? null,
      origin: [p.region, p.country].filter(Boolean).join(', ') || null,
    })),
    other: [...depositHits, ...categoryHits],
    total,
  });
}
