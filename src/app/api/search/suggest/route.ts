import { NextResponse } from 'next/server';
import { queryProducts } from '@/lib/repository';
import { fetchCategories } from '@/lib/taxonomy-remote';

export const dynamic = 'force-dynamic';

/**
 * Подсказки для панели поиска (п.30 ТЗ).
 *
 * Источник — Storefront API Admik: товары (поиск по названию/артикулу на бэкенде)
 * и категории (дерево /categories). Подсказки по минеральным видам и
 * месторождениям — ЭТАП 2 (в каноне Admik таких сущностей нет).
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

  const [{ items, total }, categories] = await Promise.all([
    queryProducts({ q, perPage: 6, sort: 'popular' }),
    fetchCategories().catch(() => []),
  ]);

  const categoryHits = categories
    .filter((c) => normalize(c.name).includes(needle))
    .slice(0, 3)
    .map((c) => ({ label: c.name, hint: 'Категория', href: `/catalog/${c.slug}` }));

  return NextResponse.json({
    minerals: [],
    products: items.map((p) => ({
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      price: p.price,
      image: p.images[0]?.url ?? null,
      origin: [p.region, p.country].filter(Boolean).join(', ') || null,
    })),
    other: categoryHits,
    total,
  });
}
